const { ApolloServer, gql } = require("apollo-server");
const { buildFederatedSchema } = require("@apollo/federation");
const DataLoader = require('dataloader');

const typeDefs = gql`
  extend type Query {
    topProducts(first: Int = 5, ids: [ String ]): [Product]
    product(id: String): Product
  }

  type Product @key(fields: "upc upcs") {
    upc: String!
    upcs: [ String ]
    name: String
    price: Int
    weight: Int
  }
`;

const resolvers = {
  Product: {
    __resolveReference(object) {
        //console.log('object in product ref resolver', object);
        return productLoader().load(object.upc)
    }
  },
  Query: {
    async topProducts(_, args) {
        console.log('hitting topProducts resolver');
        if (args.ids && args.ids.length) {
            const returnVal = await productLoader().loadMany(args.ids)
            returnVal[0].upcs = args.ids;
            //console.log('returnVal', returnVal);
            return returnVal;
        }
        return products.slice(0, args.first);
    },
    product(_, args) {
        console.log('hitting straight product resolver');
        if (args.id) {
            return productLoader().load(args.id)
        }

    }
  }
};

const server = new ApolloServer({
  schema: buildFederatedSchema([
    {
      typeDefs,
      resolvers
    }
  ])
});

server.listen({ port: 4003 }).then(({ url }) => {
  console.log(`🚀 Server ready at ${url}`);
});

function productLoader () {
    return new DataLoader(batchGetProducts);
}

function batchGetProducts (upcs) {
    console.log('PRODUCTS :: using batch fn with upcs: ', upcs);
    return new Promise(res => {
        const batched = upcs.map((upc) => {
            return products.find(({upc: productUpc }) => productUpc === upc) || null;
        });

        return res(batched);
    });
}

const products = [
  {
    upc: "1",
    name: "Table",
    price: 899,
    weight: 100
  },
  {
    upc: "2",
    name: "Couch",
    price: 1299,
    weight: 1000
  },
  {
    upc: "3",
    name: "Chair",
    price: 54,
    weight: 50
  },
  {
    upc: "4",
    name: "Bed",
    price: 54,
    weight: 50
  }
];
