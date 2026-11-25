# How a Spring proxy changes a method call

Suppose the same checkout method needs timing, authorization and a transaction. Spring can inject a proxy implementing the service API. An incoming call goes through the matching interceptors before it reaches the target. Each interceptor can run code before the call, after it returns, or when it throws. The rule that selects the methods is a **pointcut**. The behavior attached to it is **advice**.

## Which calls can the proxy see?

A JDK proxy implements interfaces. A class-based proxy subclasses the target, so an overridable method is required for interception on that subclass. A final implementation method can still be reached through a JDK interface proxy. Once execution is inside the target, a call such as `this.reserve()` goes straight to the target. Any transaction already active on that thread continues, and the self-call adds no new advice. [Spring AOP proxying](https://docs.spring.io/spring-framework/reference/core/aop/proxying.html)

To test that distinction, call the Spring-managed service through its injected reference and inspect the observable result. A unit test that constructs the target with `new` is a good test of its business rules. A Spring integration test exercises the transaction interceptor as well.
