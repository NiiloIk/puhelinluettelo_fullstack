const mongoose = require('mongoose')

if (process.argv.length<3) {
    console.log('give password as argument')
    process.exit(1)
}

const password = process.argv[2]

const url =
  `mongodb+srv://fullstack:${password}@atlascluster.3kvnhs1.mongodb.net/puhelinluettelo_db?retryWrites=true&w=majority`

mongoose.set('strictQuery', false)
mongoose.connect(url)


const personSchema = new mongoose.Schema({
  name: String,
  number: String,
})

const Person = mongoose.model('Person', personSchema)

const createNewPerson = (name, number) => {
    const person = new Person({ name, number, })
    // console.log("person", person)
    person.save().then(result => {
        console.log(`Added ${result.name} number ${result.number} to Phonebook`)
        mongoose.connection.close()
    })
}

const printAllPersons = () => {
    Person.find({}).then(result => {
        result.forEach(person => {
            console.log(person.name, person.number)
        })
        mongoose.connection.close()
    })
}


if (process.argv.length === 3) {
    printAllPersons()
} else if (process.argv.length === 5) {
    const name = process.argv[3]
    const number = process.argv[4]
    createNewPerson(name, number)
}