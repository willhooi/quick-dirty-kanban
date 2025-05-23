import { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import { Form, Button, Container } from 'react-bootstrap';

export default function Register({ onSwitch }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const register = (e) => {
    e.preventDefault();
    createUserWithEmailAndPassword(auth, email, password).catch(alert);
  };

  return (
    <Container>
      <h3>Register</h3>
      <Form onSubmit={register}>
        <Form.Control className="mb-2" type="email" placeholder="Email" onChange={e => setEmail(e.target.value)} />
        <Form.Control className="mb-2" type="password" placeholder="Password" onChange={e => setPassword(e.target.value)} />
        <Button type="submit" className="me-2">Register</Button>
        <Button variant="link" onClick={onSwitch}>Login</Button>
      </Form>
    </Container>
  );
}
