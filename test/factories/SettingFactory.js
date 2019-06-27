const Factory = require('rosie').Factory;
const faker = require('faker');

module.exports = Factory.define('setting')
  .attr('identifier', () => {
    return faker.lorem.word();
  })
  .attr('content', JSON.parse('{ "property": "value" }'));
