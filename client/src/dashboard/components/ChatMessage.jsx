export default function ChatMessage({ message }) {
  const isUser = message.sender === 'user';
  return (
    <div className={`mb-5 flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[72%] ${isUser ? 'items-end' : 'items-start'} flex flex-col`}>
        <div
          className={`rounded-2xl px-6 py-4 text-[17px] leading-relaxed ${
            isUser
              ? 'bg-gradient-to-r from-[#2f53eb] to-[#2b5ee9] text-white'
              : 'bg-[#f1f4fb] text-[#273152]'
          }`}
        >
          {message.body.split('\n').map((line, index) => (
            <p key={`${message.id}-${index}`}>{line}</p>
          ))}
        </div>
        {message.cta ? (
          <button className="topbar-btn mt-3 !rounded-lg !px-5 !py-2 !text-[15px]">{message.cta}</button>
        ) : null}
        <span className="mt-2 text-[13px] text-[#7580a1]">{message.time}</span>
      </div>
    </div>
  );
}
