import * as React from 'react'
import Avatar from '@mui/material/Avatar'
import Button from '@mui/material/Button'
import CssBaseline from '@mui/material/CssBaseline'
import TextField from '@mui/material/TextField'
import Radio from '@mui/material/Radio'
import RadioGroup from '@mui/material/RadioGroup'
import FormControlLabel from '@mui/material/FormControlLabel'
import FormControl from '@mui/material/FormControl'
import FormLabel from '@mui/material/FormLabel'
import Checkbox from '@mui/material/Checkbox'
import Link from '@mui/material/Link'
import Grid from '@mui/material/Grid'
import Box from '@mui/material/Box'
import LockOutlinedIcon from '@mui/icons-material/LockOutlined'
import Typography from '@mui/material/Typography'
import Container from '@mui/material/Container'
import { createTheme, ThemeProvider } from '@mui/material/styles'
import { useNavigate } from 'react-router-dom'

function Copyright (props) {
  return (
    <Typography
      variant='body2'
      color='text.secondary'
      align='center'
      {...props}
    >
      {'Copyright © '}
      <Link color='inherit' href='https://mui.com/'>
        Your Website
      </Link>{' '}
      {new Date().getFullYear()}
      {'.'}
    </Typography>
  )
}

const theme = createTheme()

export default function SignIn () {
  const [cond, setCondition] = React.useState('advanced')
  const [username, setUsername] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [status, setStatus] = React.useState('') // [idle, pending, resolved, rejected]
  const [message, setMessage] = React.useState('')

  const navigate = useNavigate()

  async function authenticate () {
    const res = await fetch('http://34.70.132.79/api/signup', {
      method: 'POST',
      mode: 'cors',
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      body: JSON.stringify({
        username: username,
        password: password,
        condition: cond
      })
    })
      .then(res => res.json())
      .then(res => {
        console.log(res)
        setStatus(res.status)
        setMessage(res.message)
        let editorState = null
        let flowSlice = null
        let editorSlice = null
        if (res.preload === true) {
          editorState = res.editorState
          flowSlice = res.flowSlice
          editorSlice = res.editorSlice
        }

        const taskProblem = res.taskProblem
        const taskDescription = res.taskDescription

        const task = {
          topic: taskProblem,
          description: taskDescription
        }

        console.log('task: ', task)

        const sessionId = Math.floor(Math.random() * 10000)

        if (res.status === 'success') {
          navigate('/editor', {
            state: {
              condition: 'advanced',
              username: username,
              preload: res.preload,
              sessionId: sessionId,
              editorState: editorState,
              flowSlice: flowSlice,
              editorSlice: editorSlice,
              taskDescription: task
            }
          })
        }
      })
  }

  return (
    <ThemeProvider theme={theme}>
      <Container component='main'>
        <CssBaseline />
        <Box
          sx={{
            marginTop: 15,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {/* <Avatar sx={{ m: 1, bgcolor: 'secondary.main' }}>
            <LockOutlinedIcon />
          </Avatar> */}
          <Typography component='h1' variant='h5'>
            Welcome to VISAR 👋
          </Typography>
          <Box
            sx={{
              mt: 2,
              width: "35%"
            }}
          >
            <TextField
              margin='normal'
              required
              fullWidth
              id='username'
              label='Please enter a nickname'
              value={username}
              onFocus={() => {
                setStatus('idle')
                setMessage('')
              }}
              onChange={e => {
                setUsername(e.target.value)
              }}
              autoFocus
            />
            {/* <TextField
              margin='normal'
              required
              fullWidth
              value={password}
              onFocus={() => {
                setStatus('idle')
                setMessage('')
              }}
              onChange={e => {
                setPassword(e.target.value)
              }}
              label='Password'
              type='password'
              id='password'
              //   autoComplete="current-password"
            /> */}
            {/* <RadioGroup
              aria-labelledby='condition-radio-buttons-group-label'
              value={cond}
              onChange={e => {
                setCondition(e.target.value)
              }}
              name='radio-buttons-group'
            >
              <FormControlLabel
                value='baseline'
                control={<Radio />}
                label='Apple version'
              />
              <FormControlLabel
                value='control'
                control={<Radio />}
                label='Banana version'
              />
              <FormControlLabel
                value='advanced'
                control={<Radio />}
                label='Orange version'
              />
            </RadioGroup> */}
            <Button
              type='submit'
              fullWidth
              variant='contained'
              sx={{ mt: 3, mb: 2 }}
              onClick={authenticate}
            >
              Enter
            </Button>
            {status === 'fail' && message === 'Password incorrect' && (
              <Typography sx={{ color: 'red' }}>Password incorrect</Typography>
            )}
            {status === 'fail' && message === 'User not found' && (
              <Typography sx={{ color: 'red' }}>User not found</Typography>
            )}
          </Box>
        </Box>
      </Container>
    </ThemeProvider>
  )
}
