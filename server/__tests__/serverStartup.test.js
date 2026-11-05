const fs = require('fs');
const path = require('path');
const vm = require('vm');

async function startup(schemaReady) {
  const server = { on: jest.fn(), listen: jest.fn(), close: jest.fn() };
  const registerJobs = jest.fn().mockResolvedValue();
  const process = { env: {}, on: jest.fn(), exit: jest.fn() };
  const console = { log: jest.fn(), error: jest.fn() };
  const dependencies = {
    dotenv: { config() {} }, http: { createServer: () => server }, './app': {},
    './api/models/DRDB': { schemaReady }, './jobs/scheduler': { registerJobs },
  };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../server.js'), 'utf8'), {
    require: name => {
      if (!(name in dependencies)) throw new Error('Unexpected dependency: ' + name);
      return dependencies[name];
    }, process, console, setTimeout,
  });
  await new Promise(resolve => setImmediate(resolve));
  return { server, registerJobs, process, console };
}

test('waits for schema migrations before listening and registering jobs', async () => {
  let ready;
  const result = await startup(new Promise(resolve => { ready = resolve; }));
  expect(result.server.listen).not.toHaveBeenCalled();
  expect(result.registerJobs).not.toHaveBeenCalled();
  ready();
  await new Promise(resolve => setImmediate(resolve));
  expect(result.server.listen).toHaveBeenCalledWith(3000, expect.any(Function));
  expect(result.registerJobs).toHaveBeenCalledTimes(1);
  expect(result.process.exit).not.toHaveBeenCalled();
});

test('failed migrations stop startup instead of allowing broken login queries', async () => {
  const error = new Error('Could not add Study.IntroductionEmailSubject');
  const result = await startup(Promise.reject(error));
  expect(result.server.listen).not.toHaveBeenCalled();
  expect(result.registerJobs).not.toHaveBeenCalled();
  expect(result.process.exit).toHaveBeenCalledWith(1);
  expect(result.console.error).toHaveBeenCalledWith(expect.stringContaining('backend was not started'), error);
});
