require('dotenv').config()
const express = require('express')
const morgan = require('morgan')
const cors = require('cors')
const app = express()
const Person = require('./modules/person')

let myMorgan = morgan(function (tokens, req, res) {

  if (tokens.method(req, res) === 'POST') {
    return [
      tokens.method(req, res),
      tokens.url(req, res),
      tokens.status(req, res),
      tokens.res(req, res, 'content-length'), '-',
      tokens['response-time'](req, res), 'ms',
      JSON.stringify(res.req.body)
    ].join(' ')
  }
  return [
    tokens.method(req, res),
    tokens.url(req, res),
    tokens.status(req, res),
    tokens.res(req, res, 'content-length'), '-',
    tokens['response-time'](req, res), 'ms'
  ].join(' ')
})

const errorHandler = (error, request, response, next) => {
  console.error(error.message)

  if (error.name === 'CastError') {
    return response.status(400).send({ error: 'malformatted id' })
  } else if (error.name = 'ValidationError') {
    return response.status(400).json({ error: error.message })
  }

  next(error)
}

app.use(cors())
app.use(express.static('dist'))
app.use(express.static('build'))
app.use(express.json())
app.use(myMorgan)

app.get('/api/persons', (request, response, next) => {
  Person.find({}).then(person => {
    response.json(person)
  })
    .catch(error => next(error))
})

app.get('/api/persons/:id', (request, response, next) => {
  Person.findById(request.params.id)
    .then(person => {
      response.json(person)
    })
    .catch(error => next(error))
})

app.delete('/api/persons/:id', (request, response, next) => {
  Person.findByIdAndDelete(request.params.id)
    .then(result => {
      response.status(204).end()
    })
    .catch(error => next(error))
})

app.get('/info', (request, response) => {
  const date = new Date
  let personsAmount = 0

  Person.find({}).then(person => {
    personsAmount = person.length
    if (personsAmount > 0) {
      const responseString =
        `<p>Phonebook has info for ${personsAmount} people </p>` +
        `<p>${date}</p>`
      response.send(responseString)
    } else {
      const responseString =
        `<p>Phonebook has ${personsAmount} people </p>` +
        `<p>${date}</p>`
      response.send(responseString)
    }
  })
    .catch(error => next(error))
})

app.put('/api/persons/:id', (request, response, next) => {
  const { name, number } = request.body

  Person.findByIdAndUpdate(request.params.id,
    { name, number, },
    { new: true, runValidators: true, context: 'query' })
    .then(updatedPerson => {
      response.json(updatedPerson)
    })
    .catch(error => next(error))
})

const generateNumber = () => {
  const MAX_LENGTH = 12
  let number = ""
  for (let i = 0; i < MAX_LENGTH; i++) {
    number += Math.floor((Math.random() * 10))
    i === 1 || i === 3 ? number += "-" : ""
  }
  return number
}

app.post('/api/persons', (request, response, next) => {
  const { name, number } = request.body

  if (!name || !number) {
    return response.status(400).json({
      error: 'Content missing'
    })
  }

  const newPerson = new Person({
    name,
    number: number || generateNumber(),
  })

  newPerson.validateSync()
  // console.log(error)
  
  Person.find({ name })
    .then(person => {
      if (person.length > 0) {
        return response.status(400).json({
          error: 'Name already exists'
        })
      } else {
        newPerson.save()
          .then(savedPerson => {
            response.json(savedPerson)
        })
        .catch(error => next(error))
      }
    })
    .catch(error => {
      next(error)
    })
})

const PORT = process.env.PORT

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})

app.use(errorHandler)