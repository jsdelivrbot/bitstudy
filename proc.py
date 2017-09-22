import subprocess

cmd = ['python', 'test.py']
p = subprocess.Popen(cmd, stdout=subprocess.PIPE, bufsize=1)
for line in iter(p.stdout.readline, b''):
    if line == b'1':
    	print('shit')
p.stdout.close()
p.wait()