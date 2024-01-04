import json
import tabula

file1 = "Y:/code/sim-racing/irsdk++/docs/telemetry_11_23_15.pdf"
table = tabula.read_pdf(file1, pages="1-9")

all_vars = []
for frame in table:
    name_series = frame['Name'].tolist()
    unit_series = frame['Unit'].tolist()
    type_series = frame['Type'].tolist()
    disk_series = frame['Disk'].tolist()
    live_series = frame['Live'].tolist()
    desc_series = frame['Description'].tolist()

    table_vars = list(zip(name_series, unit_series, type_series, disk_series, live_series, desc_series))
    all_vars.extend(table_vars)

def enum_var_names():
    return '\n'.join([record[0] + "," for record in all_vars])

code = (f"""
enum IRAllVarName {{
  {enum_var_names()}   
}};        
""")

print(code)
