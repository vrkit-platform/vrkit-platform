# Define the regex pattern and capture group
$pattern = "import.*from[\s\t]+`"([a-zA-Z0-9/-_@]+)`"" # Replace with your regex; ensure capture groups are defined
$directory = "$PSScriptRoot" # Replace with your target directory

# Get all matches recursively and extract the capture group
Get-ChildItem -Path $directory -Recurse -Filter "**.mjs" | ForEach-Object {
    # Search in each file
    Select-String -Path $_.FullName -Pattern $pattern | ForEach-Object {
        # Output only the capture group's value
        $_.Matches.Groups[1].Value
    }
}
