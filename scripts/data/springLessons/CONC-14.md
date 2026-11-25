# Async execution and scheduled jobs

A checkout page needs a price and a shipping estimate. Both can be fetched at the same time. An overnight export must survive a restart once the API accepts it. Decide who starts the work, which thread owns it, and where the result lives.

## Run independent calls and combine the results

Enable async processing with `@EnableAsync`. Put the blocking calls on a separate Spring bean. The caller invokes its injected proxy, which submits each method to the named executor. In the example, both lookups start before the caller waits for either result.

```java
@Service
class Lookups {
    private final PricingClient pricingClient;
    private final CarrierClient carrierClient;

    Lookups(PricingClient pricingClient, CarrierClient carrierClient) {
        this.pricingClient = pricingClient;
        this.carrierClient = carrierClient;
    }

    @Async("ioExecutor")
    public CompletableFuture<Price> price(String sku) {
        return CompletableFuture.completedFuture(pricingClient.fetch(sku));
    }

    @Async("ioExecutor")
    public CompletableFuture<Shipping> shipping(String sku) {
        return CompletableFuture.completedFuture(carrierClient.quote(sku));
    }
}

// In the caller, lookups is the injected bean.
CompletableFuture<Quote> quote(String sku) {
    var price = lookups.price(sku);
    var shipping = lookups.shipping(sku);
    return price.thenCombine(shipping, Quote::new);
}
```

For two required results, `thenCombine` builds the quote once both succeed. If either lookup fails, the combined future completes exceptionally. For a variable number, `CompletableFuture.allOf(...)` yields a `CompletableFuture<Void>`. Read the individual futures after the barrier succeeds. Decide explicitly whether a partial answer is acceptable. Set deadlines on the HTTP clients as well as on the aggregate future. Completing a future with a timeout can leave the underlying I/O running. [Java CompletableFuture API](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/CompletableFuture.html)

## When the executor is full

Define a `ThreadPoolTaskExecutor` bean named `ioExecutor` with a core size, maximum size and bounded queue. Under the usual pool policy, tasks fill the core workers, then the queue, then additional workers up to the maximum. Size concurrency against the downstream connection budget. An unbounded queue can turn a slow dependency into a memory and latency problem. With the abort policy the submitter sees a rejection. With caller-runs, a saturated pool can execute the blocking task on the HTTP thread. Record queue wait, execution time and rejections separately.

Calling `this.price(sku)` bypasses the async proxy and blocks the caller. A future exposes worker failures to its caller. A `void` method has no return channel, so configure an `AsyncUncaughtExceptionHandler` when failures need handling. [Spring task execution](https://docs.spring.io/spring-framework/reference/integration/scheduling.html)

## What crosses the thread boundary?

Pass an order ID and immutable inputs. A worker running on another thread gets its own transaction when it calls a proxied transactional service. The caller's JDBC transaction and persistence context stay on the caller's thread. Submitting before commit lets the worker race the commit and miss the order. An after-commit listener fixes that ordering for best-effort work. For a promised export, write the job or outbox row in the same transaction as the request and return `202 Accepted` with a job ID. A worker can recover pending work after restart. [Spring transaction-bound events](https://docs.spring.io/spring-framework/reference/data-access/transaction/event.html)

## Choose the clock, then account for every replica

With `@EnableScheduling`, Spring registers scheduled methods. A scheduler handles triggers and an executor handles submitted async work. A scheduled method can run the job itself. Offloading it changes what the scheduler regards as completion. [Spring scheduling](https://docs.spring.io/spring-framework/reference/integration/scheduling.html)

| Requirement | Trigger | If one run is slow |
|---|---|---|
| Poll again 30 seconds after the last poll finishes | `@Scheduled(fixedDelay = 30_000)` | The delay begins when the method returns. If it only submits work, successive workers can overlap. |
| Aim for one invocation per minute | `@Scheduled(fixedRate = 60_000)` | On a standard pool scheduler a single repeating task can start late. Extra threads allow other tasks to run. |
| Run at 02:00 in a specified time zone | `@Scheduled(cron = "0 0 2 * * *", zone = "UTC")` | Spring cron has six fields, starting with seconds. Specify the business zone when daylight-saving behavior matters. |

With Boot's regular auto-configured thread-pool scheduler, the default pool size is one. A long poll can delay unrelated schedules. Virtual-thread scheduling uses a different scheduler, so check the active configuration before diagnosing starvation. [Spring Boot scheduler configuration](https://docs.spring.io/spring-boot/reference/features/task-execution-and-scheduling.html)

**Three pods wake up at 02:00. Who exports the file?** Each pod has its own trigger. Give each business run a unique key such as `(job_type, business_date)`. Let workers atomically claim pending work with a recoverable lease. If a worker dies after uploading and before marking the job done, retry with the same output key. A lock limits overlap while it is held. The idempotent write handles that crash window. Monitor oldest pending job age, last successful run, retries and duration. A healthy HTTP endpoint can coexist with a stalled scheduler.
