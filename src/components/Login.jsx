import { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import { Form, Button, Container } from 'react-bootstrap';

export default function Login({ onSwitch }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const login = (e) => {
    e.preventDefault();
    signInWithEmailAndPassword(auth, email, password).catch(alert);
  };

  return (
    <Container>
      <h3>Login</h3>
      <Form onSubmit={login}>
        <Form.Control className="mb-2" type="email" placeholder="Email" onChange={e => setEmail(e.target.value)} />
        <Form.Control className="mb-2" type="password" placeholder="Password" onChange={e => setPassword(e.target.value)} />
        <Button type="submit" className="me-2">Login</Button>
        <Button variant="link" onClick={onSwitch}>Register</Button>
      </Form>
    </Container>
  );
}
