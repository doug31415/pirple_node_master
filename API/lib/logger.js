const log = (data) => {
     // log path
     console.log(`request recieved on path: ${data.method} ${data.path}`);
     console.log('queries', data.queries);
     console.log('headers', data.headers);
     console.log('payload', data.payload || 'none');
}

module.exports = {
     log
}