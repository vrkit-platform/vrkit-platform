## Authentication & Authorization

Shell script example used to create a cookie bag (`cookie-jar.txt`)

```sh
EMAIL="john.smith@iracing.com"
PASSWORD="SuperSecure123"

# To lowercase
EMAILLOWER=$(echo -n "$EMAIL" | tr [:upper:] [:lower:])

# SHA256 -> Base64
ENCODEDPW=$(\
	echo -n $PASSWORD$EMAILLOWER | \
	openssl dgst -binary -sha256 | \
	openssl base64)

BODY="{\"email\": \"$EMAIL\", \"password\": \"$ENCODEDPW\"}"

/usr/bin/curl \
	-c cookie-jar.txt \
	-X POST \
	-H 'Content-Type: application/json' \
	--data "$BODY" https://members-ng.iracing.com/auth
```


## Samples

username: 'jonathan.glanz@gmail.com'
password: 'jonny5'

```typescript
import IracingAPI from 'iracing-api'
import * as Prompt from '@inquirer/prompts';

const main = async () => {
  const email = await Prompt.input({ message: 'Username/Email' })
  const password = await Prompt.password({ message: 'Password' })

  const ir = new IracingAPI()

  // First you have to login to iracing using your credentials to be able to use the API.
  await ir.login(email, password)

  // Now you can use any endpoint, e.g. getCars
  const cars = await ir.car.getCars()

  console.log(cars)
}

main().then(() => 'Done')

export {}
```
