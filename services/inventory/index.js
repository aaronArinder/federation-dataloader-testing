const { ApolloServer, gql } = require("apollo-server");
const { buildFederatedSchema } = require("@apollo/federation");
const DataLoader = require('dataloader');

const typeDefs = gql`
  extend type Product @key(fields: "upc") {
    upc: String! @external
    weight: Int @external
    price: Int @external
    inStock: Boolean
    shippingEstimate: Int @requires(fields: "price weight")
  }
`;

const resolvers = {
  Product: {
    __resolveReference: async (object) => {
      return {
        ...object,
        inStock: await inventoryLoader().load(object.upc)
      };
    },
    shippingEstimate(object) {
      // free for expensive items
      if (object.price > 1000) return 0;
      // estimate is based on weight
      return object.weight * 0.5;
    }
  }
};

const server = new ApolloServer({
  /*
   * note that we're taken out the context here
   * */
  schema: buildFederatedSchema([
    {
      typeDefs,
      resolvers
    }
  ])
});

server.listen({ port: 4004 }).then(({ url }) => {
  console.log(`🚀 Server ready at ${url}`);
});

function inventoryLoader () {
    console.log('new dataloader instance');
    return new DataLoader(batchGetInventory);
}

function batchGetInventory (upcs) {
    console.log('INVENTORY :: using batch fn with upcs: ', upcs);
    return new Promise(res => {
        const batched = upcs.map((upc) => {
            return inventory.some(({upc: inventoryUpc, inStock }) => inventoryUpc === upc && inStock);
        });
        return res(batched);
    });
}

const inventory = [
  { upc: "1", inStock: true },
  { upc: "2", inStock: false },
  { upc: "3", inStock: true }
];
