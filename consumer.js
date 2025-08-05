const knex = require('knex')({
  client: 'pg',
  connection: {
    host: 'postgres',
    port: 5432,
    user: 'par',
    password: 'par',
    database: 'par',
  },
});

const { RABBITMQ_URL, QUEUE_NAME, connectRabbitMQ } = require('./rabbitconn');
const { applyRule } = require('./querybuilder');

async function fetchExistingUserIdsForGroup(groupName) {
  const groupId = await getGroupIdByName(groupName);

  const rows = await knex('user_groups')
    .select('user_id')
    .where('group_id', groupId);
  return new Set(rows.map(r => r.user_id));
}

async function fetchMatchingUsers(rule) {
  const query = knex('users').select('id');
  applyRule(query, rule);
  const rows = await query;
  return new Set(rows.map(r => r.id));
}

async function getGroupIdByName(groupName) {
  const group = await knex('groups')
    .select('id')
    .where('name', groupName)
    .first();
  
  if (!group) {
    throw new Error(`Group with name "${groupName}" not found.`);
  }
  
  return group.id;
}

async function updateUserGroups(groupName, newMatches, existingMatches) {
  const groupId = await getGroupIdByName(groupName);

  // compute how many users we need to add and remove to a group.
  const toAdd = [...newMatches].filter(id => !existingMatches.has(id));
  const toRemove = [...existingMatches].filter(id => !newMatches.has(id));

  if (toAdd.length) {
    await knex('user_groups').insert(
      toAdd.map(user_id => ({ user_id, group_id: groupId }))
    ).onConflict(['user_id', 'group_id']).ignore();
  }

  if (toRemove.length) {
    await knex('user_groups')
      .where('group_id', groupId)
      .whereIn('user_id', toRemove)
      .del();
  }

  console.log(`Group '${groupId}': Added ${toAdd.length}, Removed ${toRemove.length}`);
}

async function startConsumer() {
  console.log('Consumer starting...');
  const connection = await connectRabbitMQ(RABBITMQ_URL);
  const channel = await connection.createChannel();
  await channel.assertQueue(QUEUE_NAME, { durable: true });

  console.log('Waiting for messages...');
  channel.consume(QUEUE_NAME, async (msg) => {
    if (!msg) return;

    try {
      const message = JSON.parse(msg.content.toString());
      const { group, rule } = message;
      console.log(`Processing rule update for group: ${group}`);
      const existingUserIds = await fetchExistingUserIdsForGroup(group);
      const matchingUserIds = await fetchMatchingUsers(rule);
      await updateUserGroups(group, matchingUserIds, existingUserIds);
      channel.ack(msg);
    } catch (err) {
      console.error('Error processing message:', err);
      channel.nack(msg, false, false);
    }
  }, { noAck: false });
}

module.exports = {
  startConsumer
};