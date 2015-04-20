# -*- coding: iso-8859-1 -*-

'''
@author: Christoph Franke
'''

from argparse import ArgumentParser
import numpy as np
import re
import glob
import os

def get_entries_from_file(filename):
    '''
    reads hashtagged entries from a file

    @param filename  name and location of the file to be parsed
    @return          lines read from file
    '''
    f = open(filename,  'r')
    lines = f.readlines()
    f.close()
    return lines

def convert_popdev(infile, outfile):
    lines = get_entries_from_file(infile)
    db_id = 1;
    year = 0
    f = open(outfile,'w')
    for line in lines:
        if line.startswith('##'):
            year = line.replace('##', '').replace('**', '').strip()
            continue
        if len(line) == 0:
            break
        line = line.replace(',', '.')
        line = line.split(';')
        rs = line[0]
        p = (len(line) - 1) / 2
        female = ','.join(line[1:p+1])
        female = ('"{' + female.strip() + '}"').replace('{.', '{0.').replace(',.', ',0.')
        male = ','.join(line[p+1:])
        male = ('"{' + male.strip() + '}"').replace('{.', '{0.').replace(',.', ',0.')
        newline = [str(db_id), rs, year]
        newline.append(female)
        newline.append(male)
        newline = ';'.join(newline)
        f.write(newline + '\n')
        db_id += 1;

    f.close()

def main():
    parser = ArgumentParser(description="CSV Conversion")

    parser.add_argument("-in", action="store",
                            help="input_csv",
                            dest="input_csv", default=None)

    parser.add_argument("-out", action="store",
                        help="output_csv",
                        dest="output_csv", default=None)

    options = parser.parse_args()

    convert_popdev(options.input_csv, options.output_csv)

if __name__ == "__main__":
    main()
