from setuptools import setup
import os
from subprocess import call

call(["pip3", "install", "git+https://github.com/dpallot/simple-websocket-server.git"])
call(["pip3", "install", "git+https://github.com/giampaolo/psutil.git"])

user = os.listdir("/home")
pth = '/home/' + user[0]

call(["wget", "-P", pth, "https://raw.githubusercontent.com/teceduc/s2-tecbook/master/s2_tb/s2_tb.js"])

setup(
    name='s2-tb',
    version='0.21',
    packages=['s2_tb'],

    entry_points={
            'console_scripts': ['s2tb = s2_tb.s2_tb:run_server',
                                'sbx_to_sb2 = s2_pi.sbx_to_sb2:sbx_to_sb2'],
        },
    url='https://github.com/teceduc/s2-tecbook',
    license='GNU General Public License v3 (GPLv3)',
    author='Rodrigo Rodrigues da Silva',
    author_email='rodrigo.silva@teceducacao.com.br',
    description='Scratch 2 Extensions for the TECbook',
    keywords=['Raspberry Pi', 'Scratch 2', 'Extensions', 'TECbook'],
        classifiers=[
            'Development Status :: 4 - Beta',
            'Environment :: Other Environment',
            'Intended Audience :: Education',
            'License :: OSI Approved :: GNU Affero General Public License v3 or later (AGPLv3+)',
            'Operating System :: OS Independent',
            'Programming Language :: Python :: 3.4',
            'Topic :: Education',
            'Topic :: Software Development',
        ],
)
