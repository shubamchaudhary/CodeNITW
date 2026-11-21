// The tech market's skills, by area: what the job finder looks for in a job's description, in
// Naukri's skill chips, and in your resumes. Checked against real job descriptions with
// naukri-refresher-dev/skills-coverage.mjs (it lists the tech words a set of JDs used that this
// dictionary missed).
//
// One entry per skill: 'Label | alias | alias ...'
//   - The label is an alias too, unless the entry starts with "!" (for "C", "R", "Go": names that
//     are also letters or English words, found only through their context aliases).
//   - Aliases match whole words in any case. A space also matches "-", "_" or nothing
//     ("spring boot" finds "SpringBoot", "spring-boot"); a dot between letters may be left out or
//     be a space ("node.js" finds "nodejs", "Node JS").
//   - "=Word" is case-sensitive, for names that are also plain English ("=React", "=Spring").
//   - "~source" is a regular expression (case-insensitive), "=~source" a case-sensitive one: for
//     names that need context, like Go ("Java, Go") or C ("C/C++").
//   - 'Label > Parent, Parent | ...': knowing this skill means knowing its parents too (Spring Boot
//     > Spring). When a job names a skill and its parent, only the skill counts.
// Areas: `ai` marks GenAI/ML work (how much of a job is AI decides its list); `count: false` marks
// what isn't a technology to match (methodologies, tools like JIRA, basics every engineer has);
// `weight` is how strongly the area says what a job is about.

const AREAS = [
  ['lang', 'Languages', { weight: 3 }, [
    'Java > JVM | core java | java 8 | java 11 | java 17 | java 21 | java se | j2se | advanced java | java programming | java 1.8',
    'Kotlin', 'Scala', 'Groovy', 'Clojure',
    'Python | python 3 | python programming | python scripting',
    '!Go | golang | go lang | go developer | go programming | go language | goroutines | go routines | go-kit'
      + ' | ~go(?=\\s*\\(\\s*golang)'
      + ' | ~go(?=\\s*(?:,|/|&|\\band\\b|\\bor\\b)\\s*(?:java|python|rust|c\\+\\+|node(?:\\.?js)?|kotlin|scala|ruby|typescript|c#|elixir)(?![a-z0-9+#]))'
      + ' | ~(?<=(?:java|python|rust|c\\+\\+|node(?:\\.?js)?|kotlin|scala|ruby|typescript|c#|elixir)\\s*(?:,|/|&|\\band\\b|\\bor\\b)\\s*)go'
      + ' | ~go(?=\\s+(?:developer|engineer|programming|microservices|services|backend|modules))',
    'Rust',
    '!C | c programming | c language | ansi c | c99 | c11'
      + ' | ~c(?=\\s*(?:/|,|&|\\band\\b|\\bor\\b)\\s*c\\+\\+)'
      + ' | ~(?<=c\\+\\+\\s*(?:/|,|&|\\band\\b|\\bor\\b)\\s*)c'
      + ' | ~(?<=(?:java|python|rust|go|golang)\\s*(?:,|/|&)\\s*)c(?=\\s*(?:,|/|&|\\band\\b|\\bor\\b))',
    'C++ | cpp | c plus plus | modern c++ | c++11 | c++14 | c++17 | c++20 | vc++',
    'C# | c sharp | csharp',
    'F#',
    'VB.NET | vb net | visual basic .net',
    'Visual Basic | vba | vb6 | excel vba',
    'JavaScript | js | ecmascript | es6 | es2015 | vanilla js | vanilla javascript',
    'TypeScript',
    'Dart',
    '!Swift | swift programming | swift language | swift 5 | =~Swift(?=\\s*(?:,|/|&|\\band\\b|\\bor\\b|\\(|\\d))'
      + ' | ~(?<=(?:ios|objective-c|xcode|kotlin|swiftui)\\s*(?:,|/|&|\\band\\b|\\bor\\b)\\s*)swift',
    'Objective-C | objective c | objc | obj-c',
    'Ruby', 'PHP', 'Perl',
    '!R | r programming | r language | rstudio | r studio | r shiny'
      + ' | ~r(?=\\s*(?:,|/)\\s*(?:python|sas|sql|matlab|julia|scala|spss)(?![a-z0-9+#]))'
      + ' | ~(?<=(?:python|sas|sql|matlab|julia|scala|spss)\\s*(?:,|/|&|\\band\\b|\\bor\\b)\\s*)r(?![&/\'])',
    'Julia', 'MATLAB', 'Lua', 'Elixir', 'Erlang', 'Haskell', 'OCaml', 'Zig', 'Fortran', 'Delphi | object pascal',
    '!SAS | sas programming | base sas | sas analytics | sas enterprise guide',
    '!Assembly | assembly language | x86 assembly | arm assembly',
    'Bash/Shell | bash | bash scripting | shell scripting | shell script | shell scripts | unix shell | zsh | ksh | =Shell',
    'PowerShell',
    'WebAssembly | wasm',
    'JVM | java virtual machine | jvm internals | jvm tuning | garbage collection | gc tuning',
  ]],

  ['backend', 'Backend frameworks and runtimes', { weight: 3 }, [
    '!Spring > Java | =Spring | spring framework | spring core | spring ioc | spring aop | spring 5 | spring 6',
    'Spring Boot > Spring | springboot | spring boot 3',
    'Spring MVC > Spring', 'Spring Security > Spring', 'Spring Batch > Spring', 'Spring Integration > Spring', 'Spring AI > Spring',
    'Spring Cloud > Spring | spring cloud gateway | spring cloud config | spring cloud stream',
    'Spring Data JPA > Spring, JPA, JDBC | spring data | spring jpa',
    'Spring WebFlux > Spring | webflux | project reactor | reactor core',
    'Netflix Eureka > Spring Cloud | eureka',
    'Hystrix', 'Zuul', 'OpenFeign | feign | feign client',
    'Hibernate > JPA, JDBC | hibernate orm', 'JPA > Java | java persistence api', 'MyBatis | ibatis', 'jOOQ', 'JDBC | jdbc template | jdbctemplate',
    'Micronaut', 'Quarkus', 'Vert.x | vertx', 'Dropwizard', 'Play Framework', 'Akka', 'Ktor', 'Helidon', 'Javalin',
    'Java EE | j2ee | jee | jakarta ee | java ee 8',
    'EJB | enterprise java beans', 'JSP | java server pages', 'Servlets | servlet | java servlets', 'JSF | java server faces',
    'Struts | apache struts | struts 2', 'Apache Camel | camel routes', 'JAX-RS | jaxrs | jersey | resteasy', 'JAX-WS | jaxws | apache cxf',
    'Netty', 'Lombok', '!Jackson | jackson databind | fasterxml jackson | jackson library',
    'Tomcat | apache tomcat', 'Jetty', 'JBoss | wildfly | jboss eap', 'WebLogic | oracle weblogic', 'WebSphere | ibm websphere | websphere liberty', 'GlassFish', 'Undertow',
    '!Node.js > JavaScript | node.js | nodejs | node js | =Node',
    'Express.js > Node.js | expressjs | express js | ~(?<=node(?:\\.?js)?\\s*(?:,|/|&|\\band\\b|\\bor\\b|with|\\+)\\s*)express',
    'NestJS > Node.js | nest.js | nest js', 'Koa > Node.js | koa.js | koajs', 'Fastify > Node.js', 'Hapi.js > Node.js | hapijs',
    'Sails.js > Node.js | sailsjs', 'Deno', 'Bun | bun.js | bun runtime', 'Socket.IO | socketio | socket io',
    'Django > Python | django framework', 'Django REST Framework > Django | drf | django rest', 'Flask > Python', 'FastAPI > Python | fast api',
    'Tornado | tornado web', 'aiohttp', 'Sanic', 'Starlette', 'SQLAlchemy', 'Pydantic', 'asyncio | async io', 'Gunicorn', 'Uvicorn',
    'Ruby on Rails > Ruby | =Rails | ruby-on-rails | =RoR', 'Sinatra',
    'Laravel > PHP', 'Symfony > PHP', 'CodeIgniter', 'Yii', 'CakePHP', 'Zend | laminas',
    '.NET | ~\\.net(?:\\s*(?:core|framework|\\d))? | dotnet | dot net | .net core | .net framework | .net 6 | .net 8',
    'ASP.NET > .NET | aspnet | asp.net core | asp.net mvc | asp net | asp.net web api',
    'Entity Framework > .NET | ef core | entity framework core', 'LINQ > .NET', 'WCF > .NET', 'WPF > .NET', 'WinForms > .NET | windows forms',
    'Blazor > .NET', 'ADO.NET > .NET',
    '!Gin | gin-gonic | gin framework | gin gonic | gin (go)', 'Beego', 'GORM',
    'Actix | actix-web', 'Axum', 'Tokio',
    'Phoenix Framework | phoenix framework | elixir phoenix | phoenix liveview',
    '!Vapor | vapor swift | vapor framework',
  ]],

  ['api', 'APIs and protocols', { weight: 2 }, [
    'REST APIs | restful | rest api | rest apis | restful api | restful apis | restful services | rest services | rest web services'
      + ' | restful web services | rest-based | restful web service | rest endpoints | =REST',
    'SOAP | =SOAP | soap web services | soap services | soap api',
    'GraphQL | graph ql', 'Apollo GraphQL > GraphQL | apollo graphql | apollo client | apollo server | apollo federation', 'Hasura',
    'gRPC', 'Protocol Buffers | protobuf | protobufs', 'Apache Thrift | =Thrift',
    'WebSockets | websocket | web sockets | web socket', 'Server-Sent Events | server sent events | =SSE', 'Webhooks | webhook',
    'OpenAPI | swagger | openapi spec | open api specification | swagger ui', 'API Design | api contracts | api versioning | api-first | api first design | api specifications',
    'Postman | postman collections',
    'OData', 'JSON-RPC | json rpc',
  ]],

  ['frontend', 'Frontend', { weight: 2 }, [
    '!React > JavaScript, HTML, CSS | =React | react.js | reactjs | react js | react 18 | react hooks',
    'Redux > React | redux toolkit | redux-saga | redux saga | redux thunk', 'React Query > React | tanstack query | react-query',
    'Zustand', 'MobX', 'Recoil', 'Jotai',
    'Next.js > React | nextjs | next js', 'Gatsby', 'Remix | remix.run',
    'Angular > TypeScript, HTML, CSS | angular 2+ | angular2 | angular 8 | angular 12 | angular 14 | angular 16',
    'AngularJS | angular.js | angular js', 'RxJS', 'NgRx',
    'Vue.js > JavaScript, HTML, CSS | vue | vuejs | vue js | vue 3', 'Vuex', 'Pinia', 'Nuxt.js | nuxt | nuxtjs',
    'Svelte | sveltekit', 'SolidJS | solid.js', 'Preact', 'Ember.js | emberjs', 'Backbone.js | backbonejs', 'jQuery', 'Alpine.js | alpinejs',
    '!Lit | lit-element | lit element | lit.dev', 'Web Components | web component | custom elements | shadow dom',
    'HTML | html5 | html 5', 'CSS | css3 | css 3', 'Sass | scss', '!Less | less css | =LESS', 'Tailwind CSS > CSS | tailwind | tailwindcss',
    'Bootstrap > CSS | twitter bootstrap', 'Material UI | mui | material-ui | material design', 'Chakra UI', 'Ant Design | antd',
    'Styled Components | styled-components', 'Storybook', 'shadcn/ui | shadcn | shadcn ui', 'Radix UI',
    'Webpack', 'Vite | vitejs', 'Rollup.js | =Rollup', 'Parcel.js | parceljs', 'esbuild', 'Babel', 'Gulp', '!Grunt | gruntjs | grunt.js', 'Turborepo', 'Lerna',
    'Three.js | threejs', 'D3.js | d3 | d3js', 'Chart.js | chartjs', 'Highcharts', 'ECharts', 'WebGL', 'Canvas API | html5 canvas',
    'PWA | progressive web app | progressive web apps | service workers | service worker',
    'Micro Frontends | micro-frontends | microfrontends | module federation',
    'Server-Side Rendering | server side rendering | =SSR | ssg | static site generation',
    '!Web Accessibility | web accessibility | a11y | wcag | accessibility standards', 'Responsive Design | responsive web design | responsive ui | mobile-first design',
    'Web Performance | core web vitals | lighthouse | web vitals',
    'Figma', 'Adobe XD', 'Electron | electron.js | electronjs', 'Tauri', 'Browser Extensions | chrome extensions | browser extension | chrome extension',
  ]],

  ['mobile', 'Mobile', { weight: 3 }, [
    'Android | android sdk | android development | android studio | android app development',
    'Jetpack Compose > Android | compose ui', 'Android Jetpack > Android | room database | workmanager | livedata',
    'iOS | ios development | ios sdk | ios app development', 'SwiftUI > iOS', 'UIKit > iOS', '!Core Data > iOS | coredata', 'Xcode',
    'React Native > React | react-native | reactnative', 'Flutter', 'Xamarin', '.NET MAUI | maui', 'Ionic | ionic framework',
    'Cordova | phonegap | apache cordova', '!Capacitor | capacitorjs | ionic capacitor', '!Expo | expo go | expo sdk | expo router', 'Kotlin Multiplatform | kmm | kotlin multiplatform mobile',
    '!Fastlane | =Fastlane', 'Mobile App Development | mobile development | mobile apps | mobile applications',
  ]],

  ['data_store', 'Databases and search', { weight: 2 }, [
    'SQL | sql queries | ansi sql | sql programming',
    'PL/SQL > SQL | plsql | pl sql', 'T-SQL > SQL | tsql | transact-sql',
    'RDBMS > SQL | relational databases | relational database | sql databases | relational dbms',
    'NoSQL | no sql | nosql databases | non-relational databases',
    'PostgreSQL > RDBMS | postgres | postgre sql | postgre | psql',
    'MySQL > RDBMS | my sql', 'MariaDB > RDBMS', 'SQL Server > RDBMS | mssql | ms sql | microsoft sql server | ms sql server | sqlserver',
    'Oracle Database > RDBMS | oracle db | oracle database | oracle rdbms | oracle sql | oracle 19c | oracle 12c | oracle 11g'
      + ' | ~oracle(?=\\s*(?:,|/|&|\\band\\b|\\bor\\b)\\s*(?:mysql|postgres|sql server|mongodb|db2|sybase|pl/sql))'
      + ' | ~(?<=(?:mysql|postgres(?:ql)?|sql server|mongodb|db2)\\s*(?:,|/|&|\\band\\b|\\bor\\b)\\s*)oracle',
    'SQLite', 'IBM Db2 > RDBMS | db2', 'Sybase', 'Teradata', 'H2 Database | h2 db | h2 database',
    'MongoDB > NoSQL | mongo | mongo db | mongodb atlas', 'Mongoose > MongoDB',
    'Cassandra > NoSQL | apache cassandra', 'ScyllaDB > NoSQL | scylla', 'DynamoDB > NoSQL, AWS | dynamo db | amazon dynamodb',
    'Couchbase > NoSQL', 'CouchDB > NoSQL', 'HBase > NoSQL | apache hbase', 'Cloud Bigtable > NoSQL, GCP | bigtable | google bigtable',
    'Redis > NoSQL, Caching | redis cache | redis cluster', 'Memcached > Caching', 'Hazelcast', 'Ehcache', 'Apache Ignite', 'Aerospike',
    'Elasticsearch | elastic search', 'OpenSearch', 'Apache Solr | solr', 'Apache Lucene | lucene',
    'Algolia', 'Meilisearch', 'Typesense', 'Full-Text Search | full text search | fulltext search | tsvector',
    'Neo4j | cypher query language', 'ArangoDB', 'JanusGraph', 'Amazon Neptune > AWS | aws neptune', 'TigerGraph', 'Graph Databases | graph database | graph db',
    'InfluxDB', 'TimescaleDB', 'QuestDB', 'Time-Series Databases | time series database | time-series database | tsdb',
    'ClickHouse | click house', 'Apache Druid | druid', 'Apache Pinot | pinot', 'Apache Doris', 'StarRocks',
    'CockroachDB', 'TiDB', 'YugabyteDB | yugabyte', 'Vitess', 'PlanetScale', 'Supabase',
    'Firebase | firebase auth | firebase realtime database | firebase cloud messaging | fcm', 'Firestore > Firebase, NoSQL | cloud firestore',
    'Cloud Spanner > GCP | google cloud spanner | spanner', 'Azure Cosmos DB > Azure, NoSQL | cosmos db | cosmosdb',
    'Amazon Aurora > AWS, RDBMS | aurora', 'Amazon RDS > AWS | aws rds | =RDS',
    'Snowflake', 'BigQuery | big query', 'Amazon Redshift > AWS | redshift', 'Databricks', 'Azure Synapse > Azure | synapse analytics',
    'Vertica', 'Greenplum', 'Presto | prestodb', 'Trino', 'Amazon Athena > AWS | athena',
    'etcd', 'Apache ZooKeeper | zookeeper', 'RocksDB', 'LevelDB',
    'Liquibase', 'Flyway', 'Prisma', 'TypeORM', 'Sequelize', 'Knex.js | knex', 'Drizzle ORM | drizzle',
    'Stored Procedures | stored procedure | triggers and functions',
    'Database Design | schema design | database schema design | database modeling | db design | schema changes | schema evolution',
    'Query Optimization | query tuning | sql tuning | query optimisation | sql optimization | query performance tuning | sql performance tuning',
    'Database Indexing | db indexing | index tuning | indexing strategies | indexing',
    'Database Migration | data migration | database migrations | schema migrations',
  ]],

  ['messaging', 'Messaging and streaming', { weight: 2 }, [
    'Apache Kafka > Message Queues, Pub/Sub, Stream Processing | kafka', 'Kafka Streams > Apache Kafka', 'ksqlDB > Apache Kafka | ksql',
    'Kafka Connect > Apache Kafka', 'Confluent > Apache Kafka | confluent platform | confluent cloud', 'Schema Registry',
    'RabbitMQ > Message Queues | rabbit mq | amqp', 'ActiveMQ > Message Queues | apache activemq | artemis', 'IBM MQ > Message Queues | websphere mq | mqseries | mq series',
    'Amazon SQS > AWS, Message Queues | sqs | aws sqs', 'Amazon SNS > AWS | sns | aws sns', 'Amazon Kinesis > AWS, Stream Processing | kinesis',
    'Google Pub/Sub > GCP, Pub/Sub | google pubsub | cloud pub/sub | gcp pub/sub | google cloud pub/sub',
    '!Azure Service Bus > Azure, Message Queues | azure service bus | =Service Bus', 'Azure Event Hubs > Azure | event hubs | eventhub | eventhubs',
    'Azure Event Grid > Azure | event grid', 'Amazon EventBridge > AWS | eventbridge', 'AWS Step Functions > AWS | step functions',
    'Apache Pulsar | pulsar', 'NATS | =NATS | nats.io | nats jetstream', 'ZeroMQ | zmq | 0mq', 'MQTT', 'Redis Streams > Redis',
    'Celery', 'Sidekiq', 'BullMQ | bull queue', '!Temporal | temporal.io | temporal workflows | =Temporal', 'Camunda', 'Apache NiFi | nifi',
    'Debezium', 'Change Data Capture | =CDC | change data capture',
    'JMS > Message Queues | java message service',
    'Message Queues | message queue | message queues | message broker | message brokers | messaging queues | message queuing | messaging systems | queuing | queueing',
    'Pub/Sub | publish-subscribe | publish subscribe | pub-sub | pubsub | publish/subscribe',
    'Stream Processing | streaming data | real-time streaming | event streaming | streaming ingest | streaming pipelines | data streaming',
    'Workflow Orchestration | workflow orchestration | workflow engines | workflow engine',
  ]],

  ['cloud', 'Cloud', { weight: 2 }, [
    'AWS | amazon web services | =AWS',
    'AWS EC2 > AWS | ec2 | amazon ec2', 'AWS S3 > AWS | s3 | amazon s3 | aws s3 | simple storage service',
    'AWS Lambda > AWS, Serverless | aws lambda | amazon lambda | lambda functions (aws)'
      + ' | ~lambda(?=\\s*(?:,|/|&|\\band\\b)\\s*(?:s3|ec2|dynamodb|sqs|sns|api gateway|ecs|eks|step functions))'
      + ' | ~(?<=(?:s3|ec2|dynamodb|sqs|sns|api gateway|ecs|eks|aws)\\s*(?:,|/|&|\\band\\b)\\s*)lambda',
    'AWS ECS > AWS | ecs | amazon ecs | elastic container service', 'AWS EKS > AWS, Kubernetes | eks | amazon eks', 'AWS Fargate > AWS | fargate',
    'Amazon API Gateway > AWS, API Gateway | aws api gateway', 'Amazon CloudFront > AWS, CDN | cloudfront', 'Amazon CloudWatch > AWS | cloudwatch',
    'AWS CloudFormation > AWS, Infrastructure as Code | cloudformation', 'AWS CDK > AWS, Infrastructure as Code | aws cdk',
    'AWS IAM > AWS | aws iam', 'Amazon Route 53 > AWS | route 53 | route53', 'AWS ELB > AWS, Load Balancing | elb | alb | elastic load balancer | application load balancer',
    'AWS Elastic Beanstalk > AWS | elastic beanstalk | beanstalk', 'AWS Glue > AWS | aws glue | glue jobs | glue etl',
    'Amazon EMR > AWS | amazon emr | aws emr | emr cluster | ~(?<=(?:s3|lambda|ec2|eks|glue|redshift|athena)\\s*(?:,|/|&)\\s*)emr'
      + ' | ~emr(?=\\s*(?:,|/)\\s*(?:ec2|eks|s3|glue|spark|lambda))', 'Amazon SageMaker > AWS, MLOps | sagemaker', '!Amazon Bedrock > AWS | amazon bedrock | aws bedrock | =~Bedrock(?=\\s*(?:,|/|[Aa]gents|[Kk]nowledge|[Gg]uardrails|[Mm]odels?))',
    'Amazon Cognito > AWS | cognito', 'AWS Secrets Manager > AWS | secrets manager', 'AWS KMS > AWS | aws kms | =KMS',
    'Amazon ElastiCache > AWS, Caching | elasticache', 'AWS Amplify > AWS | =Amplify', 'AWS AppSync > AWS | appsync',
    'AWS CodePipeline > AWS, CI/CD | codepipeline | codebuild | codedeploy | codecommit', 'AWS Batch > AWS', 'AWS SAM > AWS, Serverless | serverless application model',
    'GCP | google cloud | google cloud platform | =GCP',
    'Google Compute Engine > GCP | compute engine | =GCE', 'GKE > GCP, Kubernetes | google kubernetes engine',
    '!Cloud Run > GCP | google cloud run | gcp cloud run | =Cloud Run', '!Cloud Functions > GCP, Serverless | google cloud functions | gcp cloud functions | =Cloud Functions', '!App Engine > GCP | google app engine | gcp app engine | =App Engine',
    'Google Cloud Storage > GCP | gcs', '!Dataflow > GCP | google dataflow | cloud dataflow | gcp dataflow', 'Dataproc > GCP', 'Vertex AI > GCP, MLOps | vertexai',
    '!Cloud SQL > GCP | google cloud sql | gcp cloud sql | =Cloud SQL', '!Cloud Build > GCP, CI/CD | google cloud build | gcp cloud build',
    '!Cloud Composer > GCP, Apache Airflow | google cloud composer | =Cloud Composer',
    'Azure | microsoft azure | ms azure',
    'Azure Functions > Azure, Serverless', 'AKS > Azure, Kubernetes | azure kubernetes service', 'Azure App Service > Azure | =App Service',
    'Azure DevOps > Azure, CI/CD | vsts | azure pipelines | azure repos', 'Azure SQL > Azure, SQL Server | azure sql database',
    'Azure Blob Storage > Azure | azure blob | azure storage', 'Azure Key Vault > Azure | key vault | keyvault',
    'Azure API Management > Azure, API Gateway | apim | azure apim',
    'Azure AD > Azure | azure active directory | entra id | microsoft entra | =AAD', 'Azure AD B2C > Azure AD | azure b2c | =~B2C(?=\\s*(?:\\(|[Tt]enant|[Aa]uth|[Ll]ogin|[Ii]dentity|OAuth)) | ~(?<=oauth\\s+(?:via\\s+)?)b2c',
    'Azure Data Factory > Azure | =ADF | data factory', 'Azure ML > Azure, MLOps | azure machine learning', 'Azure Logic Apps > Azure | logic apps',
    'Azure AI Services > Azure | cognitive services | azure cognitive services | azure ai services | azure ai search | azure cognitive search',
    'Azure Monitor > Azure | application insights | app insights', 'Azure Container Apps > Azure', 'Azure Container Registry > Azure | =ACR',
    'Oracle Cloud | oracle cloud infrastructure', 'IBM Cloud', 'Alibaba Cloud', 'DigitalOcean', 'Heroku', 'Vercel', 'Netlify',
    'Cloudflare | cloudflare workers', 'Linode', 'OpenStack', 'VMware | vsphere | esxi',
    'Multi-Cloud | multi cloud | hybrid cloud',
  ]],

  ['devops', 'DevOps and infrastructure', { weight: 1.5 }, [
    'Docker | dockerfile | docker compose | docker-compose | containerization | containerisation | containerized | containerised | docker swarm | containers',
    'Kubernetes | k8s | kubectl | kubernetes operators', '!Helm > Kubernetes | helm charts | helm chart | =Helm', 'Kustomize > Kubernetes',
    'OpenShift > Kubernetes | red hat openshift', 'Rancher', 'Podman', 'containerd',
    'Istio > Service Mesh', 'Linkerd > Service Mesh', 'Envoy | envoy proxy | =Envoy', 'Service Mesh | service-mesh',
    'Consul | hashicorp consul', '!Nomad | hashicorp nomad', 'HashiCorp Vault | =~Vault(?=\\s*(?:,|/|&|\\band\\b))',
    'Terraform > Infrastructure as Code | terraform cloud', 'Terragrunt > Terraform', 'Pulumi > Infrastructure as Code', 'Crossplane',
    'Ansible', '!Chef | chef infra | ~chef(?=\\s*(?:,|/|&|\\band\\b|\\bor\\b)\\s*(?:puppet|ansible|salt))'
      + ' | ~(?<=(?:puppet|ansible|salt)\\s*(?:,|/|&|\\band\\b|\\bor\\b)\\s*)chef', 'Puppet', 'SaltStack | salt stack', '!Packer | hashicorp packer | ~packer(?=\\s*(?:,|/)\\s*(?:terraform|ansible|vagrant))', 'Vagrant',
    'Infrastructure as Code | iac | infrastructure-as-code',
    'CI/CD | ci cd | cicd | ci/cd pipelines | ci-cd | continuous integration | continuous delivery | continuous deployment | build pipelines | release pipelines',
    'Jenkins > CI/CD | jenkins pipelines | jenkinsfile', 'GitHub Actions > CI/CD | github action', 'GitLab CI > CI/CD | gitlab ci/cd | gitlab-ci',
    'CircleCI > CI/CD | circle ci', 'Travis CI > CI/CD', 'TeamCity > CI/CD', '!Bamboo > CI/CD | atlassian bamboo | =Bamboo',
    'Argo CD > CI/CD, GitOps | argocd | argo-cd', 'Argo Workflows | argo rollouts', 'Flux CD > GitOps | fluxcd', 'Spinnaker > CI/CD', 'Tekton > CI/CD',
    'Buildkite > CI/CD', 'Harness CI/CD > CI/CD | harness ci | harness cd | harness.io', 'GitOps',
    'Maven | apache maven', 'Gradle', 'Apache Ant | ant build', 'sbt', 'Bazel', 'CMake', 'Makefile | makefiles | gnu make',
    'Nexus Repository | sonatype nexus | nexus repository', 'JFrog Artifactory | artifactory | jfrog', 'SonarQube | sonarcloud | sonar qube',
    'Git | git workflows | gitflow | git flow', 'GitHub', 'GitLab', 'Bitbucket', 'SVN | subversion', 'Perforce', '!Mercurial | =Mercurial',
    'Nginx', 'Reverse Proxies | reverse proxy | reverse proxies', 'Apache HTTP Server | apache httpd | httpd | apache web server', 'HAProxy', 'Traefik', 'Kong Gateway > API Gateway | kong gateway | =Kong',
    'Apigee > API Gateway', 'Tyk > API Gateway', 'Gravitee > API Gateway | gravitee apim',
    'Linux | linux administration | rhel | centos | ubuntu | debian | red hat linux | linux internals',
    'Unix | =UNIX | unix', 'Windows Server', 'Cron Jobs | cron | cronjobs | crontab',
    'Serverless | serverless architecture | serverless framework | faas | serverless functions',
    'Site Reliability Engineering | sre practices | site reliability engineering | slos | slis | error budgets',
    'Deployment Strategies | blue-green | blue green deployment | blue-green deployments | canary deployments | canary releases | canary deployment'
      + ' | rolling updates | rolling deployments | zero-downtime | zero downtime deployment | zero-downtime deployments',
    'Disaster Recovery | backup and recovery | high availability and disaster recovery',
  ]],

  ['observability', 'Observability', { weight: 1 }, [
    'Observability | monitoring and alerting | monitoring & alerting | logging and monitoring | distributed tracing | application monitoring | centralized logging | structured logging | log aggregation',
    'Prometheus', 'Grafana', 'Datadog', 'New Relic', 'Dynatrace', 'AppDynamics', 'Splunk',
    'ELK Stack | elk | elastic stack', 'Logstash > ELK Stack', 'Kibana > ELK Stack', 'Fluentd', 'Fluent Bit | fluentbit', 'Grafana Loki | =Loki',
    'Jaeger', 'Zipkin', 'OpenTelemetry | otel | open telemetry', 'Sentry', 'PagerDuty', 'Nagios', 'Zabbix', 'Elastic APM', 'Honeycomb.io | =Honeycomb',
  ]],

  ['data', 'Data engineering and analytics', { weight: 2 }, [
    'Apache Spark | spark | spark sql | spark streaming | spark core', 'PySpark > Apache Spark, Python', 'Scala Spark > Apache Spark',
    'Apache Hadoop | hadoop | hdfs | mapreduce | map reduce | hadoop yarn | =YARN', 'Apache Hive | hive | hiveql', 'Apache Pig | pig latin',
    'Apache Flink | flink | pyflink', 'Apache Beam', 'Apache Airflow | airflow', 'Luigi', 'Dagster', 'Prefect',
    'dbt | data build tool | =DBT', 'Fivetran', 'Airbyte', 'Talend', 'Informatica | informatica powercenter | iics', 'SSIS', 'Pentaho', 'Matillion',
    'Delta Lake', 'Apache Iceberg | iceberg tables | =Iceberg', 'Apache Hudi | hudi', 'Parquet | apache parquet', 'Apache Avro | avro', 'Apache Arrow',
    'Data Lake | data lakes | datalake | lakehouse | data lakehouse', 'Data Warehousing | data warehouse | data warehouses | =DWH | =EDW',
    'ETL | =ELT | etl pipelines | data pipelines | data pipeline | etl processes | etl/elt', 'Data Modeling | data modelling | dimensional modeling | dimensional modelling | star schema',
    'Big Data | big-data', 'Data Governance | data quality | data lineage', 'Data Catalog | datahub | amundsen | unity catalog',
    'Pandas', 'NumPy', 'SciPy', 'Polars', 'Dask', '!Ray | ray.io | ray serve | ray tune | ray cluster | anyscale', 'Jupyter | jupyter notebooks | jupyterlab | jupyter notebook',
    'Matplotlib', 'Seaborn', 'Plotly', 'Streamlit', 'Gradio',
    'Tableau', 'Power BI | powerbi | =DAX | power query', 'Looker | lookml | looker studio', 'Metabase', 'Apache Superset | =Superset',
    'Qlik | qlikview | qlik sense', 'SSRS', '!Excel | ms excel | microsoft excel | advanced excel | =~Excel(?!\\s+(?:in|at|as|with)\\b)',
    'Google Analytics | ga4', 'Mixpanel', '!Amplitude | =Amplitude', 'Segment.io | =~Segment(?=\\s*(?:,|/|\\.io))',
  ]],

  ['ml', 'Machine learning and data science', { weight: 3, ai: true }, [
    'Artificial Intelligence | =AI(?=\\s*(?:,|/|&|and)\\s*(?:ML|Machine))',
    'Machine Learning > Artificial Intelligence | =ML | ml models | machine-learning | ml algorithms | =AI/ML | ai ml | aiml | ai/ml',
    'Deep Learning | neural networks | neural network | deep neural networks', 'NLP > Artificial Intelligence | natural language processing | =NLU | sentiment analysis | text classification | named entity recognition | text analytics',
    'Computer Vision | image processing | image recognition | object detection | image classification',
    'Reinforcement Learning', 'Recommendation Systems | recommender systems | recommendation engine | recommendation engines | recsys',
    'Time Series Forecasting | time series | time-series forecasting | demand forecasting',
    'Anomaly Detection | outlier detection | detects anomalies | anomaly gate', 'Predictive Modeling | predictive analytics | predictive models',
    'Statistics | statistical analysis | statistical modeling | statistical modelling | probability and statistics',
    'A/B Testing | ab testing | a/b tests | experimentation platform', 'Feature Engineering', 'Data Science | data scientist',
    'scikit-learn | sklearn | scikit learn', 'TensorFlow', 'Keras', 'PyTorch | =Torch', 'JAX | =JAX', 'XGBoost', 'LightGBM', 'CatBoost',
    'OpenCV', 'spaCy', 'NLTK', 'Gensim', 'Hugging Face | huggingface | hf transformers | hugging face transformers',
    'Transformers | transformer models | transformer architecture | transformer-based models', 'BERT | roberta | distilbert',
    'CNN | =CNNs | convolutional neural networks | convolutional neural network', 'RNN/LSTM | =RNN | =LSTM | =RNNs | recurrent neural networks',
    'GANs | =GAN | generative adversarial networks', 'Diffusion Models | stable diffusion | diffusion model', 'YOLO | yolov5 | yolov8 | =YOLO',
    'Speech Recognition | =ASR | speech-to-text | speech to text | whisper (openai) | openai whisper', 'Text-to-Speech | =TTS | text to speech',
    'OCR | optical character recognition | tesseract',
    'MLOps | ml ops | mlops pipelines | ml pipelines | model lifecycle', 'MLflow > MLOps', 'Kubeflow > MLOps', 'Weights & Biases | wandb | w&b',
    'DVC | data version control', 'ONNX', 'TensorRT', 'Triton Inference Server | =Triton', 'Feature Store | feast | feature stores',
    'Model Serving | model deployment | model inference | inference optimization | torchserve | bentoml | seldon | model serving',
    'CUDA', 'GPU Programming | gpu computing | gpu optimization',
  ]],

  ['genai', 'GenAI and LLMs', { weight: 3, ai: true }, [
    'Generative AI > Artificial Intelligence | genai | gen ai | gen-ai | generative artificial intelligence | generative-ai',
    'LLM | llms | large language models | large language model | foundation models | foundational models | language models',
    'OpenAI API > LLM | openai | =GPT | gpt-4 | gpt-4o | gpt4 | gpt-3.5 | chatgpt | chat gpt | openai sdk',
    'Azure OpenAI > OpenAI API, Azure | azure openai service | =AOAI',
    'Anthropic Claude > LLM | =Claude | anthropic | claude api', 'Google Gemini > LLM | =Gemini | palm 2 | gemini api',
    'Llama > LLM | =Llama | llama 2 | llama 3 | llama2 | llama3 | meta llama', 'Mistral > LLM | =Mistral | mixtral',
    'Open-source LLMs > LLM | open source llms | open-source models | open source models | =Qwen | deepseek | =Gemma | phi-3',
    'LangChain > LLM, Prompt Engineering | lang chain | langchain4j | langchain.js', 'LangGraph > LLM, Prompt Engineering | lang graph', 'LlamaIndex | llama index | gpt index', '!Haystack | haystack ai | deepset haystack',
    'Semantic Kernel', 'CrewAI | crew ai', 'AutoGen | microsoft autogen', 'DSPy', 'Pydantic AI | pydantic-ai', 'OpenAI Agents SDK | agents sdk',
    'Vercel AI SDK | ai sdk', 'Mastra',
    '!RAG > LLM | retrieval augmented generation | retrieval-augmented generation | rag pipelines | rag pipeline | rag systems'
      + ' | =~RAG(?!\\s*(?:[Ss]tatus|[Rr]eporting|[Rr]ating))',
    'Advanced RAG > RAG | corrective rag | corrective-rag | self-rag | agentic rag | crag', 'GraphRAG > RAG | graph rag',
    'Knowledge Graphs | knowledge graph',
    'Agentic AI > LLM | agentic | ai agents | ai agent | autonomous agents | agentic workflows | agent frameworks | llm agents | agentic systems | agent-based systems',
    'Multi-Agent Systems > Agentic AI | multi-agent | multi agent systems | multi-agent systems | multi-agent orchestration',
    'Tool Calling > LLM | function calling | tool use | tool-calling | function-calling | typed tools',
    '!MCP | model context protocol | mcp servers | mcp server | mcp tools | mcp clients'
      + ' | =~MCP(?=\\s*(?:\\)|,|/|[Ss]ervers?|[Tt]ools?|[Pp]rotocol|[Cc]lients?|integrations?))',
    'Prompt Engineering > LLM | prompt design | prompting | prompt tuning | prompt optimization | prompt engineering techniques',
    'Fine-tuning > LLM | fine tuning | finetuning | =LoRA | =QLoRA | peft | =SFT | instruction tuning | llm fine-tuning',
    'RLHF | reinforcement learning from human feedback',
    'Embeddings | embedding models | vector embeddings | text embeddings | sentence transformers | sentence-transformers | embedding model',
    'Vector Databases | vector db | vector dbs | vector database | vector store | vector stores | vector search | vectordb',
    'Pinecone > Vector Databases', 'Weaviate > Vector Databases', 'Milvus > Vector Databases', 'Qdrant > Vector Databases',
    'Chroma > Vector Databases | chromadb | chroma db', 'FAISS > Vector Databases', 'pgvector > Vector Databases, PostgreSQL',
    'HNSW > Vector Databases | hnsw index | ann search | approximate nearest neighbor | approximate nearest neighbour',
    'Semantic Search | similarity search | dense retrieval',
    'Hybrid Search > Semantic Search | bm25 | =RRF | reciprocal rank fusion | hybrid retrieval',
    'Reranking | re-ranking | rerankers | reranker | cross-encoder | cohere rerank',
    'LLM Evals > LLM | llm evaluation | llm evaluations | =evals | eval harness | ragas | deepeval | offline evals | golden sets | golden set | golden dataset',
    'LLM-as-Judge > LLM Evals | llm as a judge | llm as judge | llm-as-a-judge',
    'Retrieval Metrics | recall@k | ndcg | precision@k | mean reciprocal rank | hit rate@k',
    '!Guardrails > LLM | guardrails ai | nemo guardrails | llm guardrails | ai guardrails',
    'LangSmith', 'Langfuse', 'LLM Observability | arize phoenix | helicone | llm monitoring',
    'LLM Serving > LLM | vllm | =TGI | text generation inference | llama.cpp | llamacpp | sglang', 'Ollama',
    'Text-to-SQL > LLM | text to sql | nl2sql | nl-to-sql',
    'Chatbots | chatbot | conversational ai | conversational agents | virtual assistants | conversational interfaces',
    'Multimodal AI | multimodal | vision language models | =VLM | =VLMs | multi-modal',
    'Human-in-the-Loop | human in the loop | =HITL',
    'Context Engineering | context window | context windows',
  ]],

  ['testing', 'Testing and QA', { weight: 1 }, [
    'Unit Testing | unit tests | unit test | unit-testing', 'Integration Testing | integration tests | integration test',
    'End-to-End Testing | e2e testing | end to end testing | e2e tests | end-to-end tests', 'Performance Testing | load testing | stress testing | performance tests',
    'Test Automation | automation testing | automated testing | test automation frameworks | automated tests', 'Manual Testing',
    'API Testing | api tests', 'Contract Testing | consumer-driven contracts | =Pact | pact testing',
    'JUnit > Unit Testing | junit5 | junit 5 | junit 4', 'TestNG > Unit Testing', 'Mockito > Unit Testing', 'PowerMock', 'Spock',
    'Testcontainers > Integration Testing | test containers', 'WireMock', 'REST Assured > API Testing | rest-assured | restassured',
    'Cucumber', 'Selenium > Test Automation | selenium webdriver', 'Cypress > End-to-End Testing', 'Playwright > End-to-End Testing',
    'Puppeteer', 'WebdriverIO | wdio', 'Appium', 'Espresso | =Espresso', 'XCUITest | xctest',
    'Jest > Unit Testing', 'Mocha', 'Chai | chai.js | ~(?<=mocha\\s*(?:,|/|&|\\band\\b)\\s*)chai', 'Jasmine', 'Karma | karma runner | karma test runner',
    'Vitest', 'React Testing Library | testing library', '!Enzyme | =Enzyme',
    'pytest > Unit Testing | py.test', 'unittest | python unittest', 'Robot Framework', 'JMeter > Performance Testing | apache jmeter',
    'Gatling > Performance Testing', '!Locust > Performance Testing | locust.io | =Locust', 'k6 > Performance Testing | =k6', 'LoadRunner > Performance Testing', 'SoapUI',
    'Karate DSL | karate dsl | karate framework', 'Code Coverage | jacoco | test coverage | code coverage', 'Mutation Testing | pitest',
    'Chaos Engineering | chaos monkey | litmus chaos',
  ]],

  ['security', 'Security and identity', { weight: 1 }, [
    'OAuth 2.0 > Authentication | oauth | oauth2 | oauth 2 | oauth s2s', 'OpenID Connect > Authentication | oidc | openid',
    'SAML > Authentication | saml 2.0', 'SSO > Authentication | single sign-on | single sign on | =SSO', 'JWT > Authentication | json web tokens | json web token',
    'Keycloak', 'Okta', 'Auth0', 'LDAP', 'Active Directory | =~AD(?=\\s*(?:,|/)\\s*(?:LDAP|SSO|ldap|sso))', 'Kerberos',
    'Authentication | authorization | authn | authz | auth flows | identity propagation | access control',
    'RBAC | role-based access control | role based access control', 'IAM | identity and access management | =IAM | access management | workload identity',
    'mTLS | mutual tls', 'TLS/SSL | =TLS | =SSL | ssl/tls | ssl certificates', 'Encryption | cryptography | aes-256 | data encryption',
    'OWASP | owasp top 10', 'Penetration Testing | pen testing | pentest | pentesting | =VAPT', '=SAST | static application security testing',
    '=DAST | dynamic application security testing', 'Burp Suite', 'Nessus', 'Snyk', 'Checkmarx', 'Veracode', '!Fortify | fortify sca | fortify scan', 'SIEM',
    'Zero Trust', 'GDPR', 'PCI DSS | pci-dss | pci compliance', 'HIPAA', 'SOC 2 | soc2 | soc 2 type ii', 'ISO 27001',
    'Secure Coding | secure coding practices | application security | appsec | secure software development', 'Threat Modeling | threat modelling',
    'WAF | web application firewall', 'DDoS Protection | ddos', 'Secrets Management | key rotation | secrets rotation',
    'SCIM', 'FedRAMP', 'NIST | nist csf | nist 800-53', 'MITRE ATT&CK | mitre att&ck | mitre attack', 'SCA | =SCA | software composition analysis',
    'DLP | data loss prevention', 'OWASP ZAP | owasp zap | zap proxy', 'JWKS > JWT', 'PKI | x.509 | x509 | public key infrastructure',
    'Container Security', 'Cloud Security | cspm | cnapp', 'LLM Security > LLM | prompt injection | jailbreaking | jailbreaks | llm security | ai security',
    'Privileged Access Management | =PAM | privileged access management',
  ]],

  ['design', 'System design and architecture', { weight: 2 }, [
    'System Design | systems design | software architecture | system architecture | architecture design | solution design',
    'Low-Level Design > System Design | =LLD | low level design | object oriented design | object-oriented design | =OOD',
    'High-Level Design > System Design | =HLD | high level design',
    'Distributed Systems | distributed system | distributed computing | large-scale distributed systems | distributed architecture',
    'Microservices | micro services | microservice | microservices architecture | micro-services | microservice architecture',
    'Service-Oriented Architecture | =SOA | service oriented architecture',
    'Event-Driven Architecture | event driven | event-driven | event driven architecture | event-driven systems | event driven systems',
    'Event Sourcing', 'CQRS', 'Domain-Driven Design | =DDD | domain driven design',
    'Clean Architecture | hexagonal architecture | ports and adapters | onion architecture',
    'Design Patterns | design pattern | gof patterns | gang of four | software design patterns', 'SOLID Principles | =SOLID | solid principles',
    'Functional Programming', 'Reactive Programming | reactive systems | reactive streams',
    'Concurrency | multithreading | multi-threading | multi threading | multithreaded | concurrent programming | thread safety | parallel processing | parallelism',
    'Asynchronous Processing | async processing | asynchronous programming | async programming | asynchronous | async/await | sync/async | =async',
    'Caching | caching strategies | distributed caching | cache invalidation | caching layer | =cache',
    'CDN | content delivery network | content delivery networks', 'Load Balancing | load balancer | load balancers | load-balancing',
    'Sharding | database sharding | sharded | partitioning | data partitioning | tenant-level sharding', 'Replication | database replication | read replicas | master-slave | leader-follower',
    'Consistent Hashing', 'CAP Theorem', 'Consensus Algorithms | =Raft | =Paxos | consensus protocols',
    'Distributed Transactions | two-phase commit | =2PC | saga pattern | sagas | outbox pattern | transactional outbox',
    'Idempotency | idempotent | idempotence', 'Exactly-Once Processing | exactly-once | exactly once | at-least-once | at least once delivery | exactly-once semantics',
    'Rate Limiting | rate limiter | rate limiters | throttling', 'Circuit Breaker | circuit breakers | resilience4j',
    'Retry Patterns | retries | exponential backoff | retry mechanisms | retry logic', 'Service Discovery | service registry',
    'API Gateway | api gateways | api-gateway', 'Backpressure | back-pressure', 'Eventual Consistency | strong consistency | consistency models',
    'ACID | acid transactions | transaction management', 'Multi-Tenancy | multi-tenant | multitenant | multi tenancy | multi-tenant saas | multitenancy',
    'Feature Flags | feature flag | feature toggles | feature-flagged | feature toggle | launchdarkly',
    'Batch Processing | batch jobs | batch job | batch processing systems | batch runtime | batch flows',
    'Performance Tuning | performance optimization | performance optimisation | profiling | latency optimization',
    'Memory Management | memory leaks | memory leak',
    'Twelve-Factor App | 12-factor | twelve factor',
  ]],

  ['enterprise', 'Enterprise platforms', { weight: 3 }, [
    'SAP | =SAP | sap erp | sap ecc', 'SAP ABAP > SAP | abap | abap on hana', 'SAP HANA > SAP | =HANA', 'SAP S/4HANA > SAP | s/4hana | s4 hana | s4hana',
    'SAP FICO > SAP | =FICO | sap fi | sap co', 'SAP SD > SAP | sap sd', 'SAP MM > SAP | sap mm', 'SAP BASIS > SAP | sap basis', 'SAP UI5 > SAP | sapui5 | =UI5 | sap fiori | =Fiori',
    'SAP BTP > SAP | =BTP',
    'Salesforce | =SFDC | salesforce.com | sales cloud | service cloud | marketing cloud', 'Apex > Salesforce | =Apex | apex triggers',
    'Lightning Web Components > Salesforce | =LWC | salesforce lightning', 'Visualforce > Salesforce', 'SOQL > Salesforce',
    'ServiceNow', 'Workday HCM | workday hcm | workday integrations | workday studio', 'Oracle EBS | oracle e-business suite | oracle apps | oracle fusion | oracle erp | oracle hcm',
    'Oracle Forms', 'Pega | pega prpc | pegasystems', 'Appian', 'MuleSoft | mule esb | anypoint', 'Dell Boomi | boomi', 'TIBCO', 'IBM Integration Bus | =IIB | ibm ace | ibm app connect',
    'webMethods', 'UiPath > RPA', 'Automation Anywhere > RPA', 'Blue Prism > RPA', 'RPA | robotic process automation',
    'Power Apps | powerapps', 'Power Automate | microsoft flow', 'Power Platform', 'SharePoint | =SPFx', 'Dynamics 365 | =D365 | microsoft dynamics | dynamics crm',
    'Guidewire | gosu', 'Duck Creek', 'Sitecore', 'Adobe Experience Manager | =AEM', 'Liferay', 'Magento | adobe commerce', 'Shopify', 'WordPress', 'Drupal', 'Joomla',
    'Workato', 'Zapier', 'n8n', 'iPaaS', 'Agentforce > Salesforce', 'Mainframe | =COBOL | =JCL | =CICS | =VSAM | z/os', 'AS/400 | iseries | rpgle', 'Siebel', 'NetSuite', 'Odoo', 'OutSystems', 'Mendix',
  ]],

  ['embedded', 'Embedded and hardware', { weight: 3 }, [
    'Embedded C > C | embedded c', 'Embedded Systems | embedded software | embedded development | embedded firmware', 'RTOS | freertos | zephyr rtos | vxworks | threadx',
    'Embedded Linux | yocto | buildroot', 'Linux Kernel | kernel development | device drivers | device driver | kernel programming | linux device drivers',
    'Firmware | firmware development', 'Microcontrollers | =MCU | stm32 | arm cortex | esp32 | arduino | =AVR', 'ARM Architecture | =~ARM(?=\\s*(?:[Cc]ortex|[Aa]rchitecture|,|/))',
    'AUTOSAR', 'CAN Bus | can protocol | can bus | canoe', 'Bootloaders | u-boot | bootloader', 'BSP | board support package',
    'FPGA', 'Verilog', 'SystemVerilog', 'VHDL', 'ASIC', 'PCB Design | altium | kicad', 'IoT | internet of things | iot devices', 'Zigbee',
    'Bluetooth Low Energy | =BLE | bluetooth', 'Raspberry Pi', 'PLC Programming | =PLC | ladder logic', 'SCADA', 'DSP | digital signal processing', 'Simulink',
    'ROS | robot operating system',
  ]],

  ['network', 'Networking and telecom', { weight: 1 }, [
    'TCP/IP | =TCP | =UDP | osi model', 'DNS | domain name system', 'BGP', 'OSPF', 'VPN | =IPsec', 'Firewalls | firewall',
    'SDN | software defined networking', 'Network Security', '5G | 5g nr', 'LTE | 4g lte', 'VoIP', 'SIP Protocol | =~SIP(?=\\s*(?:,|/|[Pp]rotocol|[Tt]runk))',
    'WebRTC', 'Wireshark', 'Cisco Networking | =Cisco | =CCNA | =CCNP', 'Juniper', 'VPC | virtual private cloud | subnets',
    'Telecom OSS/BSS | oss/bss | telecom bss | telecom oss', 'MPLS', 'SD-WAN | sdwan', 'IPv6 | ipv4', 'Network Routing | routing protocols | ip routing',
  ]],

  ['graphics', 'Games, graphics and XR', { weight: 3 }, [
    '!Unity | unity3d | unity engine | ~unity(?=\\s*(?:3d|engine|developer|game)) | ~unity(?=\\s*(?:,|/)\\s*(?:unreal|c#|godot))', 'Unreal Engine | unreal | =UE4 | =UE5', 'Godot',
    'OpenGL', 'Vulkan', 'DirectX', 'Blender', 'AR/VR | augmented reality | virtual reality | mixed reality | =XR', 'ARKit', 'ARCore', 'WebXR',
    'Game Development | game dev | game development',
  ]],

  ['blockchain', 'Blockchain', { weight: 3 }, [
    'Blockchain', 'Ethereum', 'Solidity', 'Web3 | web3.js | ethers.js', 'Smart Contracts | smart contract', 'Hyperledger | hyperledger fabric',
    'Bitcoin', 'DeFi', 'NFT | =NFTs', 'Hardhat', 'Truffle', 'IPFS',
  ]],

  // Not matched against your skills: tools, ways of working and basics every engineer has.
  ['tools', 'Tools', { weight: 0, count: false }, [
    'JIRA', 'Confluence', 'IntelliJ IDEA | intellij', 'Eclipse IDE | =Eclipse', 'VS Code | visual studio code | vscode', 'Visual Studio',
    'GitHub Copilot | =Copilot | cursor ai | cursor ide | claude code | codewhisperer', 'Trello', 'Notion',
    'Microsoft Office | ms office | ms-office',
  ]],
  ['process', 'Ways of working', { weight: 0, count: false }, [
    'Agile | agile methodologies | agile methodology | agile development | agile environment', 'Scrum', 'Kanban', 'SDLC', 'Waterfall',
    'SAFe | =SAFe | scaled agile', 'DevOps | devsecops | devops practices | devops culture', 'TDD | test driven development | test-driven development',
    'BDD | behavior driven development | behaviour driven development', 'Code Review | code reviews', 'Pair Programming',
    'Technical Documentation | documentation', 'ITIL', 'Lean', 'Six Sigma', 'Incident Management | incident response | on-call | postmortems | post-incident reviews',
  ]],
  ['basics', 'Basics', { weight: 0, count: false }, [
    'OOP | oops | object oriented programming | object-oriented programming | object oriented | object-oriented',
    'Data Structures | data structure | =DSA | data structures and algorithms', 'Algorithms | algorithm | algorithmic',
    'Problem Solving | problem-solving', 'Debugging | troubleshooting', 'HTTP | =HTTPS | http/2 | http2 | http protocol',
    'JSON', 'XML', 'YAML', 'CSV', 'Operating Systems | os concepts', 'Computer Networks | computer networking | networking fundamentals', 'DBMS',
    'CS Fundamentals | computer science fundamentals | cs fundamentals', 'Clean Code | code quality | coding standards | best practices',
    'Scalability | scalable | scaling | horizontally scalable | horizontal scaling', 'High Availability | highly available | =HA',
    'Fault Tolerance | fault tolerant | fault-tolerant | resilient systems | resilience', 'Performance | performant | high performance | high-performance',
    'Reliability | reliable', 'Real-Time Systems | real-time | realtime | low latency | low-latency | high throughput | high-throughput',
    'Competitive Programming | competitive coding | leetcode | codechef | codeforces', 'Scripting | scripting languages',
    'Software Development | software engineering | application development | web development | backend development | back-end development | full stack development | full-stack development',
  ]],
];

// ---------------------------------------------------------------- compiled

const ESC = /[.*+?^${}()|[\]\\/]/g;

/** An alias in plain words → regex source. */
function plain(alias) {
  let s = '';
  for (let i = 0; i < alias.length; i++) {
    const ch = alias[i];
    if (ch === ' ') { s += '[\\s_-]*'; continue; }
    if (ch === '-' && i > 0 && i < alias.length - 1) { s += '[\\s-]?'; continue; }
    if (ch === '.' && i > 0 && /[a-z0-9]/i.test(alias[i - 1]) && /[a-z]/i.test(alias[i + 1] || '')) { s += '[\\s.]?'; continue; }
    s += ch.replace(ESC, '\\$&');
  }
  return s;
}

function compileEntry(raw, area) {
  const parts = raw.split(' | ').map((p) => p.trim()).filter(Boolean);
  let head = parts.shift();
  const own = !head.startsWith('!');
  if (!own) head = head.slice(1);
  const [labelPart, parentPart] = head.split(' > ');
  const label = labelPart.trim();
  const parents = parentPart ? parentPart.split(',').map((p) => p.trim()).filter(Boolean) : [];
  const ci = [];
  const cs = [];
  if (own && !label.startsWith('=')) ci.push(plain(label));
  for (const a of parts) {
    if (a.startsWith('=~')) cs.push(a.slice(2));
    else if (a.startsWith('~')) ci.push(a.slice(1));
    else if (a.startsWith('=')) cs.push(plain(a.slice(1)));
    else ci.push(plain(a));
  }
  const name = label.replace(/^=/, '');
  if (label.startsWith('=')) cs.push(plain(name));
  const wrap = (src, cls) => `(?<![${cls}0-9+#.])(?:${src})(?![${cls}0-9+#])`;
  const rx = [];
  if (ci.length) rx.push(new RegExp(wrap(ci.join('|'), 'a-z'), 'gi'));
  if (cs.length) rx.push(new RegExp(wrap(cs.join('|'), 'A-Za-z'), 'g'));
  return { label: name, area: area.id, ai: !!area.ai, count: area.count !== false, weight: area.weight, parents, rx };
}

export const SKILLS = [];
export const BY_LABEL = new Map();
for (const [id, name, opts, entries] of AREAS) {
  const area = { id, name, ...opts };
  for (const raw of entries) {
    const s = compileEntry(raw, area);
    if (BY_LABEL.has(s.label.toLowerCase())) throw new Error(`skills-dict: "${s.label}" is listed twice`);
    SKILLS.push(s);
    BY_LABEL.set(s.label.toLowerCase(), s);
  }
}
for (const s of SKILLS) {
  for (const p of s.parents) if (!BY_LABEL.has(p.toLowerCase())) throw new Error(`skills-dict: "${s.label}" names an unknown parent "${p}"`);
}
export const AREA_NAMES = Object.fromEntries(AREAS.map(([id, name]) => [id, name]));

/** A skill and all the skills above it (Spring Boot → Spring Boot, Spring). */
export function withParents(labels) {
  const out = new Set();
  const add = (l) => {
    const s = BY_LABEL.get(String(l).toLowerCase());
    if (!s || out.has(s.label)) return;
    out.add(s.label);
    for (const p of s.parents) add(p);
  };
  for (const l of labels) add(l);
  return out;
}

const ancestorsCache = new Map();
function ancestors(label) {
  if (ancestorsCache.has(label)) return ancestorsCache.get(label);
  const set = withParents([label]);
  set.delete(label);
  ancestorsCache.set(label, set);
  return set;
}

/**
 * Every skill a text names → Map(label → mentions). A parent named only inside one of its skills'
 * names ("AWS" in "AWS Lambda", "Spring" in "Spring Boot") isn't kept on its own: the skill is the
 * requirement. Named separately ("JavaScript, React"), both count.
 */
export function findSkills(text, { keepParents = false } = {}) {
  const t = ` ${String(text || '')} `;
  const spans = new Map(); // label → [[start, end], ...]
  for (const s of SKILLS) {
    const list = [];
    for (const rx of s.rx) {
      rx.lastIndex = 0;
      let m;
      while ((m = rx.exec(t)) && list.length < 9) list.push([m.index, m.index + m[0].length]);
    }
    if (list.length) spans.set(s.label, list);
  }
  if (!keepParents) {
    for (const [label] of spans) {
      const parents = [...ancestors(label)].filter((a) => spans.has(a));
      for (const a of parents) {
        // Inside the names of the skills below it that this text names?
        const below = [...spans.keys()].filter((l) => l !== a && ancestors(l).has(a)).flatMap((l) => spans.get(l));
        const inside = spans.get(a).every(([s, e]) => below.some(([s2, e2]) => s >= s2 && e <= e2));
        if (inside) spans.delete(a);
      }
    }
  }
  return new Map([...spans].map(([l, list]) => [l, list.length]));
}

export const skillOf = (label) => BY_LABEL.get(String(label).toLowerCase()) || null;
