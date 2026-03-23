#!/usr/bin/env node
require('dotenv').config();

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const PROFILE_TABLE = process.env.PROFILE_TABLE || 'profiles';
const PROFILE_ROLE_COLUMN = process.env.PROFILE_ROLE_COLUMN || 'role';
const PROFILE_EMAIL_COLUMN = process.env.PROFILE_EMAIL_COLUMN || 'email';
const ENABLE_PROFILE_UPSERT = (process.env.ENABLE_PROFILE_UPSERT || 'true') !== 'false';

const TEST_USERS = [
  { email: 'borrower@test.com', password: 'password123', role: 'borrower' },
  { email: 'broker@test.com', password: 'password123', role: 'broker' },
  { email: 'lender@test.com', password: 'password123', role: 'lender' },
  { email: 'admin@test.com', password: 'password123', role: 'admin' },
  { email: 'superadmin@test.com', password: 'password123', role: 'super_admin' }
];

function ensureEnv() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Set them in your environment first.'
    );
  }
}

function printHeader() {
  console.log('Creating Supabase test users for roles...');
  console.log(`- Profile upsert: ${ENABLE_PROFILE_UPSERT ? 'enabled' : 'disabled'}`);
  if (ENABLE_PROFILE_UPSERT) {
    console.log(
      `- Profile mapping: table=${PROFILE_TABLE}, role_column=${PROFILE_ROLE_COLUMN}, email_column=${PROFILE_EMAIL_COLUMN}`
    );
  }
}

async function listAllUsers(supabase) {
  const users = [];
  let page = 1;
  const perPage = 100;

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage
    });

    if (error) {
      throw new Error(`Failed listing existing users: ${error.message}`);
    }

    const batch = data?.users || [];
    users.push(...batch);

    if (batch.length < perPage) {
      break;
    }

    page += 1;
  }

  return users;
}

async function findUserByEmail(supabase, email) {
  const allUsers = await listAllUsers(supabase);
  return allUsers.find((user) => (user.email || '').toLowerCase() === email.toLowerCase()) || null;
}

async function createOrUpdateUser(supabase, { email, password, role }) {
  const existingUser = await findUserByEmail(supabase, email);

  if (!existingUser) {
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { role }
    });

    if (error) {
      throw new Error(`Failed to create ${email}: ${error.message}`);
    }

    return {
      status: 'created',
      user: data.user
    };
  }

  const mergedMetadata = {
    ...(existingUser.user_metadata || {}),
    role
  };

  const { data, error } = await supabase.auth.admin.updateUserById(existingUser.id, {
    password,
    email_confirm: true,
    user_metadata: mergedMetadata
  });

  if (error) {
    throw new Error(`Failed to update ${email}: ${error.message}`);
  }

  return {
    status: 'updated',
    user: data.user
  };
}

async function upsertProfile(supabase, user, role) {
  if (!ENABLE_PROFILE_UPSERT) {
    return { skipped: true, reason: 'disabled' };
  }

  const payload = {
    id: user.id,
    [PROFILE_EMAIL_COLUMN]: user.email,
    [PROFILE_ROLE_COLUMN]: role
  };

  const { error } = await supabase
    .from(PROFILE_TABLE)
    .upsert(payload, { onConflict: 'id' });

  if (error) {
    return { skipped: true, reason: error.message };
  }

  return { skipped: false };
}

async function run() {
  ensureEnv();
  printHeader();

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  const results = [];

  for (const spec of TEST_USERS) {
    const result = await createOrUpdateUser(supabase, spec);
    const profileResult = await upsertProfile(supabase, result.user, spec.role);

    results.push({
      email: spec.email,
      password: spec.password,
      role: spec.role,
      userId: result.user.id,
      userAction: result.status,
      profile: profileResult
    });

    console.log(
      `${result.status.toUpperCase()}: ${spec.email} (${spec.role})${profileResult.skipped ? ` | profile: skipped (${profileResult.reason})` : ' | profile: upserted'}`
    );
  }

  console.log('\nTest Credentials');
  console.log('----------------');
  for (const entry of results) {
    console.log(`${entry.email} / ${entry.password}  [role=${entry.role}]`);
  }

  console.log('\nDone.');
}

run().catch((error) => {
  console.error('Failed to create test users.');
  console.error(error.message);
  process.exit(1);
});
