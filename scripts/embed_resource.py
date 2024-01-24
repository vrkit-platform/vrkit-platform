# Copyright (c) 2014, Joseph Lisee
# All rights reserved.
#
# Redistribution and use in source and binary forms, with or without
# modification, are permitted provided that the following conditions are met:
#
# 1. Redistributions of source code must retain the above copyright notice, this
# list of conditions and the following disclaimer.
#
# 2. Redistributions in binary form must reproduce the above copyright notice,
# this list of conditions and the following disclaimer in the documentation
# and/or other materials provided with the distribution.
#
# 3. Neither the name of the copyright holder nor the names of its contributors
# may be used to endorse or promote products derived from this software without
# specific prior written permission.
#
# THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
# AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
# IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
# DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
# FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
# DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
# SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
# CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
# OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
# OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

# Based on: http://stackoverflow.com/a/11814544/138948

__author__ = "Joseph Lisee <jlisee@gmail.com>"
__doc__ = """Embed the given resources in a C file.
Example:
    embed_file foo foo.rsrc
    Creates foo.c with:
      const char foo[] = { /* bytes of resource foo */ };
      const size_t foo_len = sizeof(foo);
    Which you can use with from C++:
      extern "C" const char foo[];
      extern "C" const size_t foo_len;
"""

import argparse
import sys
import unittest


def open_file(path, mode='r'):
    """
    Open file with an option to route from stdin or stdout as needed.
    """
    if path == '-':
        if mode.count('r'):
            f = sys.stdin
        else:
            f = sys.stdout
    else:
        f = open(path, mode)

    return f


def main(argv=None):
    if argv is None:
        argv = sys.argv

    # Parse main arguments
    parser = argparse.ArgumentParser(
        description=__doc__,
        formatter_class=argparse.RawTextHelpFormatter
    )

    parser.add_argument(
        '-o', '--output', type=str,
        help='Explicitly set output file path'
    )
    parser.add_argument(
        '--run-tests', action='store_true', default=False,
        help='Run internal unit tests'
    )
    parser.add_argument(
        'symbol', type=str, nargs=1,
        help='Name of resources symbol, SYMBOL.c default output'
    )
    parser.add_argument(
        'input', type=str, nargs=1,
        help='Input file '
    )

    args = parser.parse_args(argv[1:])

    # Read our resource
    f = open_file(args.input[0],'rb')

    contents = f.read()

    # Open our output file
    symbol = args.symbol[0]

    if args.output:
        output_path = args.output
    else:
        output_path = '%s.c' % symbol

    f = open_file(output_path, 'w')

    try:
        # Header for file
        # f.write("#include <stdlib.h>\n")
        f.write("""
#ifdef __cplusplus
extern "C" {
#endif
unsigned char %s[] = {  
""" % symbol)

        # Write the contents, 11 bytes per row (fits within 80 chars)
        linecount = 0

        for ch in contents:
            # Nicely format things in rows
            if isinstance(ch,int):
                ch = chr(ch)
            f.write('%-06s ' % ('0x%0X,' % ord(ch)))

            linecount += 1

            if linecount == 11:
                f.write("\n  ")

                linecount = 0

        # Write footer
        f.write('\n};\n\n')
        f.write('size_t %s_len = sizeof(%s);\n\n' % (symbol, symbol))
        f.write("""
#ifdef __cplusplus
}
#endif
""")
    finally:
        f.close()


# Tests
import os
import shutil
import tempfile
import distutils.ccompiler
import subprocess


class UnitTests(unittest.TestCase):
    def setUp(self):
        self.tmpDir = tempfile.mkdtemp()

    def tearDown(self):
        shutil.rmtree(self.tmpDir)

    def write_file(self, name, contents):
        with open(name, 'w') as f:
            f.write(contents)

    def test_all(self):
        os.chdir(self.tmpDir)

        # Write out our resources file
        res_data = "I am in a binary\n"

        self.write_file('stuff.rc', res_data)

        # Turn into a C file
        main(['', 'test_rc', 'stuff.rc'])

        # Now build our test program with the resource bundled in
        test_prog = r"""
#include <stdio.h>
extern char test_rc[];
extern size_t test_rc_len;
int main()
{
  fwrite(test_rc , sizeof(char), test_rc_len, stdout);
  return 0;
}
"""
        self.write_file('test.c', test_prog)

        c = distutils.ccompiler.new_compiler()
        c.link_executable(['test.c', 'test_rc.c'], 'test')

        # Now make sure it produces the right output
        res = subprocess.check_output('./test')

        self.assertEqual(res_data, res)


if __name__ == '__main__':
    if sys.argv.count('--run-tests'):
        sys.argv.remove('--run-tests')
        unittest.main()
    else:
        sys.exit(main())
