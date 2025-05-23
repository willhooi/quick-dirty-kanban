import { useState } from 'react';
import GoogleLogin from './components/GoogleLogin';
import Kanban from './components/Kanban';

function App() {
  const [currentUser, setCurrentUser] = useState(null);

  return (
    <>
      <GoogleLogin onUserChange={setCurrentUser} />
      {currentUser && <Kanban user={currentUser} />}
    </>
  );
}

export default App;

