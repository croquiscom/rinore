import fs from 'fs';
import os from 'os';
import path from 'path';
import repl from 'repl';

export function setupHistory(replServer: repl.REPLServer, historyFile: string, historySize: number): void {
  fs.mkdirSync(path.join(os.homedir(), '.rinore'), { mode: 0o755, recursive: true });

  if (historyFile.startsWith('.rinore/')) {
    // no change
  } else if (historyFile.startsWith('.')) {
    // move old style history file to new path (~/.rinore)
    const newHistoryFile = '.rinore/' + historyFile.replace(/^\./, '');
    if (
      fs.existsSync(path.join(os.homedir(), historyFile)) &&
      !fs.existsSync(path.join(os.homedir(), newHistoryFile))
    ) {
      fs.renameSync(path.join(os.homedir(), historyFile), path.join(os.homedir(), newHistoryFile));
    }
    historyFile = newHistoryFile;
  } else {
    historyFile = '.rinore/' + historyFile;
  }

  historyFile = path.join(os.homedir(), historyFile);
  try {
    const data = fs.readFileSync(historyFile, 'utf8');
    if (data) {
      const histories = data.split(/[\n\r]+/);
      if (histories[histories.length - 1] === '') {
        histories.pop();
      }
      if (histories.length > historySize) {
        histories.splice(0, histories.length - historySize);
        fs.writeFileSync(historyFile, histories.join(os.EOL) + os.EOL, 'utf8');
      }
      histories.reverse();
      (replServer as any).history = histories;
    }
  } catch {
    // can not read historyFile, just skip
  }

  const fd = fs.openSync(historyFile, 'a');
  replServer.on('line', (line: string) => {
    fs.writeSync(fd, line + os.EOL, null, 'utf8');
  });
  replServer.on('exit', () => {
    fs.closeSync(fd);
  });
}
