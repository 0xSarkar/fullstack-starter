# Postgres Database Setup Steps

## 1. Connect to PostgreSQL as a superuser (like postgres):
```bash
psql -U postgres
```

## 2. Create the database:
```sql
CREATE DATABASE fullstack_starter;
```

## 3. Grant privileges to dev_user on the database:
```sql
GRANT ALL PRIVILEGES ON DATABASE fullstack_starter TO dev_user;
```

## 4. Connect to the database:
```sql
\c fullstack_starter;
```

## 5. Grant schema privileges to dev_user:
```sql
GRANT ALL ON SCHEMA public TO dev_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO dev_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO dev_user;
```

## 6. Set default privileges for future objects:
```sql
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO dev_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO dev_user;
```

## 7. (Optional) Test the connection as dev_user:
```bash
psql -U dev_user -d fullstack_starter -h localhost
```
