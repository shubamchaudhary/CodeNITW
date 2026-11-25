# Maven and the Boot application classpath

An interviewer's build question often starts with a service that compiles in the IDE and fails in the container. Follow one dependency from the POM to the executable jar.

## What runs when you build?

`mvn package` runs the default lifecycle through packaging, including compilation and unit tests. `mvn verify` also reaches the integration-test and verification phases. Integration tests run there when the build binds a plugin such as Failsafe. `clean` belongs to a separate lifecycle. The Spring Boot Maven plugin's `repackage` goal builds the executable archive when bound to the build. [Maven build lifecycle](https://maven.apache.org/guides/introduction/introduction-to-the-lifecycle.html) · [Boot executable archives](https://docs.spring.io/spring-boot/maven-plugin/packaging.html)

## Why can the runtime version surprise you?

A starter declares dependencies. A BOM in `dependencyManagement` supplies compatible versions for dependencies you actually use. Maven normally mediates competing transitive versions using the nearest declaration. Check `mvn dependency:tree` for the selected path and `mvn help:effective-pom` for inherited configuration. A `runtime` dependency is available when running the application, while a `test` dependency stays on the test classpath. An incompatible runtime version can surface as a `NoSuchMethodError` when the JVM links a call. [Maven dependency mechanism](https://maven.apache.org/guides/introduction/introduction-to-dependency-mechanism.html)
