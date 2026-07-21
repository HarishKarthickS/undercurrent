import pg from 'pg';
import argon2 from 'argon2';
import { createHash } from 'node:crypto';

const email = 'e2e-ui-test@local.invalid';
const password = process.env.E2E_PASSWORD;
if (!password) throw new Error('E2E_PASSWORD is required.');
const client = new pg.Client({ connectionString: process.env.DATABASE_URL });

await client.connect();
try {
  const existing = await client.query('select id from parent_accounts where email = $1 limit 1', [email]);
  if (!existing.rowCount) {
    const household = await client.query("insert into households (name, time_zone) values ('E2E Test Household', 'UTC') returning id");
    const passwordHash = await argon2.hash(password, { type: argon2.argon2id });
    await client.query('insert into parent_accounts (household_id, display_name, email, password_hash, email_verified_at) values ($1, $2, $3, $4, now())', [household.rows[0].id, 'E2E Parent', email, passwordHash]);
  }
  if (process.env.E2E_STUDENT_NAME && process.env.E2E_INVITE_TOKEN) {
    const student = await client.query('select students.id, students.household_id from students inner join parent_accounts on parent_accounts.household_id = students.household_id where parent_accounts.email = $1 and students.name = $2 order by students.created_at desc limit 1', [email, process.env.E2E_STUDENT_NAME]);
    if (!student.rowCount) throw new Error('The requested E2E student profile was not found.');
    await client.query('insert into student_invitations (household_id, student_id, destination_email, destination_type, parent_confirmed_student_email, token_hash, expires_at) values ($1, $2, $3, $4, $5, $6, now() + interval \'1 day\')', [student.rows[0].household_id, student.rows[0].id, email, 'parent', false, createHash('sha256').update(process.env.E2E_INVITE_TOKEN).digest('hex')]);
    console.log('Local browser device invitation is ready.');
  }
  console.log('Local browser test account is ready.');
} finally {
  await client.end();
}
