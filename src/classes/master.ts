import { toString } from 'lodash';
import { ChildProcessor } from './child-processor';
import { ParentCommand, ChildCommand } from '../interfaces';
import { childSend, errorToJSON } from '../utils';

const childProcessor = new ChildProcessor();

process.on('message', async msg => {
  try {
    switch (msg.cmd as ChildCommand) {
      case ChildCommand.Init:
        await childProcessor.init(msg.value);
        break;
      case ChildCommand.Start:
        await childProcessor.start(msg.job);
        break;
      case ChildCommand.Stop:
        break;
    }
  } catch (err) {
    console.error('Error handling child message');
  }
});

process.on('SIGTERM', () => childProcessor.waitForCurrentJobAndExit());
process.on('SIGINT', () => childProcessor.waitForCurrentJobAndExit());

process.on('uncaughtException', async (err: Error) => {
  if (!err.message) {
    err = new Error(toString(err));
  }
  await childSend(process, {
    cmd: ParentCommand.Failed,
    value: errorToJSON(err),
  });

  // An uncaughException leaves this process in a potentially undetermined state so
  // we must exit
  process.exit(-1);
});
