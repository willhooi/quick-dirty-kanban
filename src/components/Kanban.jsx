import { useEffect, useState } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Card, Container, Row, Col, Button, Modal, Form } from 'react-bootstrap';
import { db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { v4 as uuid } from 'uuid';

const Kanban = ({ user }) => {
  const [columns, setColumns] = useState({});
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [undoTask, setUndoTask] = useState(null);
  const [undoTimeout, setUndoTimeout] = useState(null);
  const [newTaskText, setNewTaskText] = useState('');

  // Fixed column order: In Progress, To Do, Done
  const columnOrder = ['inprogress', 'todo', 'done'];

  useEffect(() => {
    if (!user?.uid) return;

    const fetchData = async () => {
      try {
        const docRef = doc(db, 'kanban', user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setColumns(docSnap.data());
        } else {
          const initial = {
            todo: { name: 'To Do', items: [] },
            inprogress: { name: 'User Stories', items: [] },
            done: { name: 'Done', items: [] },
          };
          await setDoc(docRef, initial);
          setColumns(initial);
        }
      } catch (error) {
        console.error('Error fetching kanban data:', error);
      }
    };
    fetchData();

    return () => clearTimeout(undoTimeout);
  }, [user?.uid, undoTimeout]);

  const saveColumns = async (newCols) => {
    setColumns(newCols);
    try {
      if (user?.uid) {
        await setDoc(doc(db, 'kanban', user.uid), newCols);
      }
    } catch (error) {
      console.error('Error saving kanban data:', error);
    }
  };

  const onDragEnd = (result) => {
    if (!result.destination) return;

    const { source, destination } = result;

    if (source.droppableId !== destination.droppableId) {
      const sourceCol = columns[source.droppableId];
      const destCol = columns[destination.droppableId];
      const sourceItems = [...sourceCol.items];
      const destItems = [...destCol.items];
      const [movedItem] = sourceItems.splice(source.index, 1);
      destItems.splice(destination.index, 0, movedItem);

      const newCols = {
        ...columns,
        [source.droppableId]: { ...sourceCol, items: sourceItems },
        [destination.droppableId]: { ...destCol, items: destItems },
      };

      saveColumns(newCols);
    } else {
      const col = columns[source.droppableId];
      const copiedItems = [...col.items];
      const [movedItem] = copiedItems.splice(source.index, 1);
      copiedItems.splice(destination.index, 0, movedItem);

      const newCols = {
        ...columns,
        [source.droppableId]: { ...col, items: copiedItems },
      };

      saveColumns(newCols);
    }
  };

  const handleDelete = () => {
    if (!taskToDelete) return;
    const { columnId, task, index } = taskToDelete;
    const updated = {
      ...columns,
      [columnId]: {
        ...columns[columnId],
        items: columns[columnId].items.filter(item => item.id !== task.id),
      },
    };

    setUndoTask({ columnId, task, index });
    const timeout = setTimeout(() => setUndoTask(null), 5000);
    setUndoTimeout(timeout);

    setShowConfirm(false);
    setTaskToDelete(null);
    saveColumns(updated);
  };

  const handleUndo = () => {
    if (!undoTask) return;
    const { columnId, task, index } = undoTask;
    const items = [...columns[columnId].items];
    items.splice(index, 0, task);

    const updated = {
      ...columns,
      [columnId]: {
        ...columns[columnId],
        items,
      },
    };
    clearTimeout(undoTimeout);
    setUndoTask(null);
    saveColumns(updated);
  };

  const handleAddTask = () => {
    if (!newTaskText.trim() || !columns.todo) return;

    const newTask = { id: uuid(), text: newTaskText.trim() };
    const updated = {
      ...columns,
      todo: {
        ...columns.todo,
        items: [newTask, ...columns.todo.items],
      },
    };
    setNewTaskText('');
    saveColumns(updated);
  };

  return (
    <Container fluid className="mt-4">
      <h2 className="mb-4 text-center">📝 Quick & Dirty Kanban Board</h2>

      <Form
        className="mb-3 d-flex"
        onSubmit={(e) => {
          e.preventDefault();
          handleAddTask();
        }}
      >
        <Form.Control
          type="text"
          placeholder="Enter new task"
          value={newTaskText}
          onChange={(e) => setNewTaskText(e.target.value)}
          disabled={!columns.todo}
        />
        <Button
          variant="primary"
          onClick={handleAddTask}
          className="ms-2"
          disabled={!columns.todo}
        >
          Add
        </Button>
      </Form>

      <DragDropContext onDragEnd={onDragEnd}>
        <Row>
          {columnOrder.map((colId) => {
            const col = columns[colId];
            if (!col) return null;

            const columnColor =
              colId === 'todo' ? '#FFF9C4' :
              colId === 'inprogress' ? '#B2EBF2' :
              '#C8E6C9';

            return (
              <Col key={colId}>
                <h5 className="text-center">{col.name}</h5>
                <Droppable droppableId={colId}>
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className="p-3 rounded shadow-sm"
                      style={{
                        minHeight: '150px',
                        backgroundColor: columnColor,
                        borderRadius: '12px',
                      }}
                    >
                      {col.items.map((item, index) => (
                        <Draggable key={item.id} draggableId={item.id} index={index}>
                          {(provided) => (
                            <Card
                              className="mb-2 shadow-sm"
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              style={{
                                backgroundColor: '#FFFDE7',
                                borderRadius: '10px',
                                ...provided.draggableProps.style,
                              }}
                            >
                              <Card.Body className="d-flex justify-content-between align-items-center">
                                <Card.Text className="mb-0">{item.text}</Card.Text>
                                <Button
                                  variant="outline-danger"
                                  size="sm"
                                  onClick={() => {
                                    setTaskToDelete({ columnId: colId, task: item, index });
                                    setShowConfirm(true);
                                  }}
                                >
                                  &times;
                                </Button>
                              </Card.Body>
                            </Card>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </Col>
            );
          })}
        </Row>
      </DragDropContext>

      <Modal show={showConfirm} onHide={() => setShowConfirm(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>Are you sure you want to delete this task?</Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowConfirm(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDelete}>
            Delete
          </Button>
        </Modal.Footer>
      </Modal>

      {undoTask && (
        <div className="position-fixed bottom-0 end-0 p-3" style={{ zIndex: 9999 }}>
          <div className="toast show bg-light border">
            <div className="toast-body d-flex justify-content-between align-items-center">
              Task deleted
              <Button variant="link" onClick={handleUndo}>
                Undo
              </Button>
            </div>
          </div>
        </div>
      )}
    </Container>
  );
};

export default Kanban;
