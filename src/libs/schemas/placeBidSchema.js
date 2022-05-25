const schema = {
  type: 'object',
  properties: {
    body: {
      type: 'object',
      properties: {
        amount: {
          type: 'number',
          minimum: 0,
          maximum: 100,
        },
      },
      required: ['amount']
    },
  },
};

export default schema;