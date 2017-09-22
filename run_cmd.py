import os
import imp

asyncproc = imp.load_source('asyncproc', './asyncproc.py')
Process = asyncproc.Process

my_process = Process('ls')

while True:
    # check to see if process has ended
    poll = my_process.wait(os.WNOHANG)
    if poll is not None:
        break
    # print any new output
    out = my_process.read()
    if out != '':
        print out