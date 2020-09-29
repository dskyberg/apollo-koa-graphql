import http from 'http';
import assert from 'assert';

import neo4j from 'neo4j-driver';

describe('Example Neo4J', () => {
  it('should return 200', done => {
    http.get('http://127.0.0.1:1337', res => {
      assert.equal(200, res.statusCode);
      server.close();
      done();
    });
  });
});