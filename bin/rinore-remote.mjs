import net from 'net';

const argv = process.argv.slice(2);
if (argv.length === 0) {
  console.log('Usage: rinore-remote port [host]');
  console.log('Usage: rinore-remote path');
  process.exit(0);
}

const socket = net.connect.apply(net, argv);
process.stdin.pipe(socket);
socket.pipe(process.stdout);

socket.on('connect', () => {
  process.stdin.setRawMode(true);
});

socket.once('close', () => {
  process.stdin.emit('end');
});

process.stdin.on('end', () => {
  process.stdin.setRawMode(false);
  socket.end();
  console.log(); // ensure newline
});
