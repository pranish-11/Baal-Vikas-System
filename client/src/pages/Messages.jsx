import { useEffect, useState, useRef } from 'react';
import axios from '../api/axios.js';
import MessageList from '../components/MessageList.jsx';
import ChatPane from '../components/ChatPane.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useSocket } from '../context/SocketContext.jsx';

export default function Messages() {
  const { user } = useAuth();
  const socket = useSocket();
  const [conv, setConv] = useState({ conversations: [], totalUnread: 0 });
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [thread, setThread] = useState([]);
  const [draft, setDraft] = useState('');
  const [attachment, setAttachment] = useState('');

  const refreshConv = () =>
    axios.get('/api/messages/conversations').then((r) => setConv(r.data));

  useEffect(() => {
    refreshConv();
  }, []);

  useEffect(() => {
    if (!selectedId) {
      setThread([]);
      return;
    }
    axios.get(`/api/messages/${selectedId}`).then((r) => {
      setThread(r.data);
      refreshConv();
    });
  }, [selectedId]);

  useEffect(() => {
    if (!socket) return;
    
    const onNewMsg = (msg) => {
      refreshConv();
      const otherId = msg.senderId._id || msg.senderId;
      if (selectedId && (otherId === selectedId || msg.receiverId._id === selectedId || msg.receiverId === selectedId)) {
        setThread((t) => {
          if (t.find(x => x._id === msg._id)) return t;
          return [...t, msg];
        });
      }
    };
    
    const onMsgUpdate = (msg) => {
      setThread((t) => t.map(x => x._id === msg._id ? msg : x));
      refreshConv();
    };
    
    const onMsgDelete = ({ messageId }) => {
      setThread((t) => t.filter(x => x._id !== messageId));
      refreshConv();
    };

    socket.on('new_message', onNewMsg);
    socket.on('message_updated', onMsgUpdate);
    socket.on('message_deleted', onMsgDelete);

    return () => {
      socket.off('new_message', onNewMsg);
      socket.off('message_updated', onMsgUpdate);
      socket.off('message_deleted', onMsgDelete);
    };
  }, [socket, selectedId]);

  const send = async () => {
    if (!selectedId || (!draft.trim() && !attachment)) return;
    const { data } = await axios.post('/api/messages', {
      receiverId: selectedId,
      text: draft.trim(),
      attachment,
    });
    setThread((t) => [...t, data]);
    setDraft('');
    setAttachment('');
    refreshConv();
  };

  const handleEdit = async (msgId, newText) => {
    const { data } = await axios.put(`/api/messages/${msgId}`, { text: newText });
    setThread((t) => t.map(x => x._id === msgId ? data : x));
  };

  const handleDelete = async (msgId) => {
    if (!confirm('Delete this message?')) return;
    await axios.delete(`/api/messages/${msgId}`);
    setThread((t) => t.filter(x => x._id !== msgId));
    refreshConv();
  };

  return (
    <div className="page-padding">
      <div className="messages-layout">
        <MessageList
          conversations={conv.conversations}
          search={search}
          onSearchChange={setSearch}
          selectedId={selectedId}
          onSelect={setSelectedId}
        />
        <ChatPane
          thread={thread}
          currentUserId={user?.id}
          draft={draft}
          onDraftChange={setDraft}
          attachment={attachment}
          onAttachmentChange={setAttachment}
          onSend={send}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </div>
    </div>
  );
}
