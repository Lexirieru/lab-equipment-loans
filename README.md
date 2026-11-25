# Lab Equipment Loans on AWS

Individual project for **Komputasi Awan (Cloud Computing) 2026/2027**, Universitas Gadjah Mada.
Author: Axel Urwawuska Atarubby (NIU 545465)

A small system for lending lab equipment (oscilloscopes, microcontroller kits, projectors) to students.
It is split into two containerised microservices that share one MySQL database.

**Track:** B (Containers): EC2 + Docker + Amazon ECR

| Service | Users | Access | Host port (EC2 test) | Paths |
|---|---|---|---|---|
| `catalog-service` | Students | Read-only | 8080 | `/`, `/api/equipment` |
| `admin-service` | Lab staff (laboran) | Read-write (CRUD) | 8081 | `/admin`, `/admin/api/equipment` |

Both containers listen on port 8080 internally. Every admin route sits under `/admin`, so a load balancer can later
route `/admin/*` to `admin-service` and everything else to `catalog-service`.

## Data entity: `equipment`

| Column | Type | Notes |
|---|---|---|
| `id` | INT, PK | Auto increment |
| `asset_code` | VARCHAR(32) | Unique, e.g. `OSC-001` |
| `name` | VARCHAR(120) | Required |
| `category` | VARCHAR(60) | e.g. Measurement, Embedded |
| `location` | VARCHAR(80) | Which lab holds it |
| `status` | ENUM | `available`, `borrowed`, `maintenance` |
| `borrower_name` | VARCHAR(120) | Required when `borrowed`; cleared on return |
| `due_date` | DATE | Return date when `borrowed` |
| `created_at`, `updated_at` | TIMESTAMP | Set by MySQL |

## CRUD endpoints (admin-service)

| Operation | Method and path | Success |
|---|---|---|
| Create | `POST /admin/api/equipment` | 201 + item |
| Read | `GET /admin/api/equipment/:id` (list: `GET /admin/api/equipment`) | 200 + item |
| Update | `PUT /admin/api/equipment/:id` | 200 + item |
| Delete | `DELETE /admin/api/equipment/:id` | 204 |

Errors: 400 validation, 404 not found, 409 duplicate `asset_code`.
`catalog-service` exposes `GET /api/equipment` and `GET /api/equipment/:id` without `borrower_name`.

Example:

```bash
curl -X POST http://<ip>:8081/admin/api/equipment \
  -H 'Content-Type: application/json' \
  -d '{"asset_code":"OSC-001","name":"Digital Oscilloscope","category":"Measurement","location":"Lab Elektronika"}'
```

## Repository layout

```
catalog-service/   read-only service (Express + mysql2) and Dockerfile
admin-service/     CRUD service (Express + mysql2) and Dockerfile
db/schema.sql      reference schema (admin-service creates it automatically)
scripts/           run-stack.sh, seed.sh, smoke-test.sh, push-to-ecr.sh
docs/              deployment plan
```

## Run it on AWS (Week 12 setup)

Works on an AWS Cloud9 environment or a plain EC2 instance (Amazon Linux 2023, t3.micro or t3.small) in a public subnet.

1. **Security group:** allow inbound TCP 8080 and 8081 from your IP (and 22 if you use SSH).
2. **IAM:** Cloud9 already has credentials. On a plain EC2 instance in AWS Learner Lab, attach the `LabInstanceProfile` role so the AWS CLI can reach ECR.
3. **Install tools** (plain EC2 only; Cloud9 already has them):
   ```bash
   sudo dnf install -y docker git
   sudo systemctl enable --now docker
   sudo usermod -aG docker ec2-user && newgrp docker
   ```
4. **Clone and start:**
   ```bash
   git clone https://github.com/Lexirieru/lab-equipment-loans.git
   cd lab-equipment-loans
   ./scripts/run-stack.sh          # MySQL container + both services
   ./scripts/seed.sh               # sample data
   ./scripts/smoke-test.sh | tee evidence-smoke-test.txt
   ```
   To use an existing RDS MySQL instance instead of the container:
   `APP_DB_HOST=<rds-endpoint> APP_DB_PASSWORD=<password> ./scripts/run-stack.sh`
5. **Push images to ECR:**
   ```bash
   ./scripts/push-to-ecr.sh
   ```
6. Open `http://<public-ip>:8080` (catalog) and `http://<public-ip>:8081/admin` (admin).

### Configuration

| Variable | Default | Purpose |
|---|---|---|
| `PORT` | `8080` | Port inside the container |
| `APP_DB_HOST` | `localhost` | MySQL host or RDS endpoint |
| `APP_DB_PORT` | `3306` | MySQL port |
| `APP_DB_USER` | `admin` | Database user |
| `APP_DB_PASSWORD` | empty | Database password (pass at runtime, never commit) |
| `APP_DB_NAME` | `equipment_loans` | Database name |

### Cost notes

The AWS Academy budget cannot be reset. Stop the EC2 instance and choose **End Lab** when you finish.
Do not create a load balancer or Fargate service until the deployment phase.

## Local development

```bash
docker run -d --name mysql -e MYSQL_ROOT_PASSWORD=pw -p 3306:3306 mysql:8.4
cd admin-service && npm install && APP_DB_USER=root APP_DB_PASSWORD=pw PORT=8081 npm start
cd catalog-service && npm install && APP_DB_USER=root APP_DB_PASSWORD=pw npm start
```

See [docs/deployment-plan.md](docs/deployment-plan.md) for the target architecture and next phases.
