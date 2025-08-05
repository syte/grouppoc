const { v4: uuidv4 } = require('uuid');
const { RABBITMQ_URL, QUEUE_NAME, connectRabbitMQ } = require('./rabbitconn');

const RULE_TEMPLATES = [
  {
    group: 'Senior',
    rule: {
      field: 'age',
      op: '<',
      value: 70,
    },
  },
  {
    group: 'Senior',
    rule: {
      field: 'age',
      op: '<',
      value: 60,
    },
  },
  {
    group: 'YoungAmerican',
    rule: {
    op: 'AND',
    rules: [
      { field: 'age', op: '>=', value: 35 },
      { field: 'country', op: '=', value: 'USA' },
    ],
   },
  },
  {
    group: 'YoungAmerican',
    rule: {
      op: 'AND',
      rules: [
        { field: 'age', op: '>=', value: 25 },
        { field: 'country', op: '=', value: 'USA' },
      ],
    },
  },
];

async function startProducer() {
  console.log('Producer starting...');
  const connection = await connectRabbitMQ(RABBITMQ_URL);
  const channel = await connection.createChannel();
  await channel.assertQueue(QUEUE_NAME, { durable: true });

  let index = 0;
  setInterval(() => {
    const template = RULE_TEMPLATES[index % RULE_TEMPLATES.length];
    const message = {
      ...template,
      update_id: uuidv4(),
      updated_at: new Date().toISOString(),
    };
    channel.sendToQueue(QUEUE_NAME, Buffer.from(JSON.stringify(message)), { persistent: true });
    console.log('Sent rule update:', JSON.stringify(message));

    // we want to run the rules continuously in order
    index++;
  }, 10000);
}

module.exports = {
  startProducer
};