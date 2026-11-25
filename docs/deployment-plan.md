# Deployment plan

## Phase 1: Week 12 (current): design and initial infrastructure

| Component | Choice | Status |
|---|---|---|
| Network | Lab VPC, public subnet, security group allowing TCP 8080/8081 from my IP | Done in Week 12 |
| Compute | One EC2 instance (Cloud9 or Amazon Linux 2023, t3.small) running Docker | Done in Week 12 |
| Services | `catalog-service` and `admin-service` containers built from this repo | Done in Week 12 |
| Database | MySQL 8.4 container on the same instance (or the lab RDS endpoint) | Done in Week 12 |
| Registry | Two private Amazon ECR repositories: `catalog-service`, `admin-service` | Done in Week 12 |
| IAM | Lab role / instance profile used by the AWS CLI for ECR push | Done in Week 12 |

Verification: `scripts/smoke-test.sh` exercises all four CRUD endpoints over HTTP, and `scripts/push-to-ecr.sh`
lists the pushed images.

## Phase 2: managed database

- Move data to **Amazon RDS for MySQL** (db.t3.micro, single AZ) in a private subnet.
- RDS security group accepts port 3306 only from the application security group.
- Point both services at the RDS endpoint through `APP_DB_HOST`; no code change needed.

## Phase 3: container orchestration

- **Amazon ECS on AWS Fargate** cluster with one ECS service per microservice (desired count 1, scalable).
- Task definitions pull images from ECR; logs go to **Amazon CloudWatch Logs**.
- **Application Load Balancer** with path rules: `/admin/*` to `admin-service`, default to `catalog-service`.
- Restrict `/admin/*` to the lab staff source IP range with a listener rule condition.

## Phase 4: CI/CD (if the lab environment allows)

- Pushing a new image tag to ECR triggers **AWS CodePipeline**, which deploys through **AWS CodeDeploy**
  (ECS blue/green) so each service can be released independently.

## Rollback

Each image in ECR keeps its tag history. Re-running a container (or ECS task definition revision) with the previous
image tag restores the previous version.
