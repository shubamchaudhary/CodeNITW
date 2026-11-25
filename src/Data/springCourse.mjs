// IDs identify saved notes and progress. The array, not the ID, sets the reading order.
export const SPRING_PARTS = [
  {
    id: "SPRING-24", title: "Startup, beans and dependency injection",
    lessons: ["SPRING-17", "SPRING-02", "SPRING-21"],
    why: "Follow an application from main() to its first request. Explain who creates the controller, which dependencies it receives and which objects two requests share.",
    drill: "Two requests reach a singleton checkout service at once. Draw the objects the requests share. Where would you keep each buyer’s cart? Now add a second payment implementation and explain which one the constructor receives and when a wiring error surfaces.",
    answer: "Both requests can use the same singleton. Keep the cart in request-local data or in storage keyed to the buyer. Resolve the payment implementation with a qualifier or a single primary candidate. An ambiguous dependency fails when Spring creates the checkout bean, usually during startup.",
  },
  {
    id: "SPRING-25", title: "Building and configuring a Boot service",
    lessons: ["SPRING-19", "SPRING-18", "SPRING-03"],
    why: "Trace how a Maven dependency reaches the classpath, how Boot reads configuration and how those inputs decide which beans exist.",
    drill: "A payment client starts locally but is missing in production. Walk through the packaged dependency, active profile, effective property and condition report. If the starter supplies a default client, explain how an application-provided bean can replace it.",
    answer: "Inspect the runtime dependency tree and packaged jar, then check the active profile and the winning property value. Boot’s condition evaluation report identifies the condition that failed. A starter can use @ConditionalOnMissingBean so its default backs off when the application supplies its own client.",
  },
  {
    id: "SPRING-26", title: "HTTP requests, REST APIs and error handling",
    lessons: ["SPRING-11", "SPRING-05", "SPRING-08"],
    why: "Trace a POST from the servlet filter to the controller and back to the client, including validation and the error path.",
    drill: "A client retries POST /orders after losing the response. Explain how a stored idempotency key and the order commit together, what a replay returns, and how you reject the same key with a different payload. Use a controller slice with MockMvc to check the HTTP contract for an invalid request. Exercise the uniqueness constraint and concurrent retries against the database.",
    answer: "Scope a unique key to the caller and store a request fingerprint with the order ID and outcome. Perform the claim and order write atomically. A matching replay gets the recorded result. A conflicting fingerprint is a client error. If another attempt is in flight, serialize on the claim or give the client a documented retry response.",
  },
  {
    id: "SPRING-27", title: "Persistence with JPA and Hibernate",
    lessons: ["SPRING-04"],
    why: "Follow an order from Java object to SQL row, then load a page of orders with their line items. Predict the SQL, the number of queries and the effect of a concurrent edit.",
    drill: "How would you prove a repository query avoids N+1 and still pages correctly? In a @DataJpaTest, seed several parents with children, flush and clear the persistence context, then inspect SQL and the returned parent IDs. Use PostgreSQL through Testcontainers for database-specific SQL or locking behavior.",
    answer: "Fetch an ordered page of parent IDs first, including a unique tie-breaker. Fetch the children for those IDs in a second query and restore the parent order in the result. Assert page boundaries, complete children and a bounded statement count as the number of parents grows. Account for an extra count query if the API returns a Page.",
  },
  {
    id: "SPRING-28", title: "Proxies, transactions and consistency",
    lessons: ["SPRING-06", "SPRING-01"],
    why: "Trace a service call across its proxy and into the database. Identify the physical transaction, competing writes and the point at which rollback is still possible.",
    drill: "Two buyers claim the last unit while checkout also writes an audit row. Draw the transaction boundaries and predict the result if checkout fails. Change only the call to the audit helper from an injected bean to a self-call and predict the rows again.",
    answer: "Check the row count of a conditional stock decrement before inserting the order in the same transaction. If checkout rolls back, the unit is available again. An independent audit transaction can survive if its row does not require the uncommitted order. A self-call bypasses REQUIRES_NEW, so the audit row rolls back with checkout.",
  },
  {
    id: "SPRING-29", title: "Securing a request from token to method",
    lessons: ["SPRING-09", "SPRING-10", "SPRING-23", "SPRING-13", "SPRING-15"],
    why: "Follow a credential from issuance through verification and authorization. Then ask what changes when a browser sends the credential automatically.",
    drill: "An API receives a token with a valid signature but the wrong audience. Where should the request stop? Now give it the right audience but insufficient authority. Explain the different HTTP responses. Finally, move the credential into a cookie and revisit CSRF protection.",
    answer: "Configure the resource server to validate the expected audience. A token for another API fails authentication and yields 401. An accepted token without the required permission yields 403. If a browser automatically sends the credential in a cookie, protect state-changing requests against CSRF.",
  },
  {
    id: "SPRING-30", title: "Async work, scheduling and production monitoring",
    lessons: ["CONC-14", "SPRING-14"],
    why: "Move work off the request thread, decide how it survives a restart, and show how to detect a job that has stopped making progress.",
    drill: "Design a ten-minute export across three replicas. The client can retry, one worker can die after writing the file, and the scheduler can fire again during recovery. Describe the HTTP response, durable job state, claim and retry rules, an idempotent output key, and the metrics that reveal a growing backlog.",
    answer: "Commit one job per client request key and return 202 with its status URL. Claim it with an expiring lease and fence stale workers when updating completion. Write to a stable output key with conditional publication so a retry cannot publish a second result. Watch oldest pending age and last successful completion alongside retry counts.",
  },
];

export function withSpringParts(sourceTopics) {
  const byId = new Map(sourceTopics.map(t => [t.id, t]));
  const covered = new Set();
  const sectionLabel = sourceTopics.find(t => t.section === "spring").sectionLabel;
  const parts = SPRING_PARTS.map((part, index) => {
    if (byId.has(part.id)) throw new Error("Spring part ID already in use: " + part.id);
    const lessons = part.lessons.map(id => {
      if (!byId.has(id) || covered.has(id)) throw new Error("Missing or repeated Spring lesson: " + id);
      covered.add(id);
      return byId.get(id);
    });
    const minutes = lessons.reduce((sum, lesson) => sum + lesson.minutes, 0);
    const questions = lessons.flatMap(lesson => lesson.questions);
    const approx = lessons.some(lesson => lesson.duration.startsWith("≈"));
    const hours = Math.floor(minutes / 60);
    const remainder = minutes % 60;
    const duration = [hours && hours + "h", remainder && remainder + "m"].filter(Boolean).join(" ");
    return {
      id: part.id, section: "spring", sectionLabel, title: `Part ${index + 1} · ${part.title}`,
      why: part.why, lessons: part.lessons, resources: lessons.flatMap(lesson => lesson.resources),
      priority: lessons.map(lesson => lesson.priority).sort()[0], minutes,
      duration: duration ? (approx ? "≈" : "") + duration : "—", questions,
      asked: { items: questions.length },
    };
  });
  const first = sourceTopics.find(t => t.section === "spring");
  for (const topic of sourceTopics) {
    if (topic.section === "spring" && !covered.has(topic.id)) throw new Error("Spring lesson missing from course: " + topic.id);
  }
  return sourceTopics.flatMap(t => t === first ? parts : covered.has(t.id) ? [] : [t]);
}
