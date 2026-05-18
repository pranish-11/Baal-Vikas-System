import { useEffect, useState } from 'react';
import axios from '../api/axios.js';
import MessageList from '../components/MessageList.jsx';
import ChatPane from '../components/ChatPane.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export default function Messages() {
  const { user } = useAuth();
  const [conv, setConv] = useState({ conversations: [], totalUnread: 0 });
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [thread, setThread] = useState([]);
  const [draft, setDraft] = useState('');

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
    axios.get(`/api/messages/${selectedId}`).then((r) => setThread(r.data));
  }, [selectedId]);

  const send = async () => {
    if (!selectedId || !draft.trim()) return;
    const { data } = await axios.post('/api/messages', {
      receiverId: selectedId,
      text: draft.trim(),
    });
    setThread((t) => [...t, data]);
    setDraft('');
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
          onSend={send}
        />
      </div>
    </div>
  );
}
