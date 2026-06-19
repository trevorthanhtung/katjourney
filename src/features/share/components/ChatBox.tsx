import React, { useState, useEffect, useRef } from 'react';
import { HugeiconsIcon } from "@hugeicons/react";
import { SentIcon, Cancel01Icon, BubbleChatIcon, Loading01Icon, ArrowLeft01Icon } from "@hugeicons/core-free-icons";
import { ChatMessage, subscribeToMessages, sendMessage } from '../../../services/chatService';
import { UserIdentity } from '../../../services/identityService';
import { classNames } from '../../../utils/helpers';
import { getAvatarSvg } from '../../../utils/avatars';
import { renderToStaticMarkup } from 'react-dom/server';

interface ChatBoxProps {
  token: string;
  currentUser: UserIdentity;
  onClose?: () => void;
  inline?: boolean;
  isReadOnly?: boolean;
}

export function ChatBox({ token, currentUser, onClose, inline, isReadOnly = false }: ChatBoxProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [visibleTimes, setVisibleTimes] = useState<Record<string, boolean>>({});
  const [isMobileModalOpen, setIsMobileModalOpen] = useState(false);

  const renderSenderAvatar = (senderName: string) => (
    <div className="w-full h-full">
      {getAvatarSvg(senderName)}
    </div>
  );

  const toggleTime = (msgId: string) => {
    setVisibleTimes(prev => ({
      ...prev,
      [msgId]: !prev[msgId]
    }));
  };

  useEffect(() => {
    let unsubscribe: () => void;
    
    subscribeToMessages(
      token,
      (newMessages) => {
        setMessages(newMessages);
        setLoading(false);
      },
      (error) => {
        console.error(error);
        setLoading(false);
      }
    ).then(unsub => {
      unsubscribe = unsub;
    });

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [token]);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputText.trim() || sending) return;

    setSending(true);
    try {
      const avatarHtml = renderToStaticMarkup(getAvatarSvg(currentUser.name));
      await sendMessage(token, inputText, currentUser, avatarHtml);
      setInputText('');
    } catch (error) {
      console.error("Lỗi khi gửi tin:", error);
    } finally {
      setSending(false);
    }
  };

  const formatTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  const getMessageDateString = (isoString: string) => {
    try {
      const d = new Date(isoString);
      const today = new Date();
      const yesterday = new Date();
      yesterday.setDate(today.getDate() - 1);

      if (d.toDateString() === today.toDateString()) {
        return "Hôm nay";
      } else if (d.toDateString() === yesterday.toDateString()) {
        return "Hôm qua";
      } else {
        return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
      }
    } catch {
      return '';
    }
  };

  // Helper to render the actual chat UI (Header, Messages Feed, Input Area)
  const renderChatContent = (isMobileFullscreen: boolean, onBackClick?: () => void) => {
    return (
      <div className="bg-white flex flex-col overflow-hidden h-full w-full">
        {/* Header */}
        <div className="bg-gradient-to-r from-kat-hero-start via-kat-hero-end to-kat-primary-usable p-4 text-white flex justify-between items-center shrink-0 border-b border-kat-border shadow-sm">
          <div className="flex items-center gap-3 min-w-0">
            {isMobileFullscreen && onBackClick && (
              <button 
                onClick={onBackClick}
                className="p-1.5 hover:bg-white/10 rounded-full transition-colors mr-1 shrink-0 active:scale-95"
              >
                <HugeiconsIcon icon={ArrowLeft01Icon} className="w-5 h-5 text-white" />
              </button>
            )}
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center border border-white/20 shadow-inner shrink-0">
              <HugeiconsIcon icon={BubbleChatIcon} className="w-5 h-5 text-kat-primary-light animate-pulse" />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-[14px] sm:text-[15px] tracking-wide text-white flex items-center gap-1.5">
                Hộp Thoại Chuyến Đi
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              </h3>
              <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-slate-300 truncate">
                <span className="truncate">Đang chat: <span className="font-semibold text-white">{currentUser.name}</span></span>
              </div>
            </div>
          </div>
          {!isMobileFullscreen && !inline && onClose && (
            <button 
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-full transition-all duration-200 hover:rotate-90 active:scale-90"
            >
              <HugeiconsIcon icon={Cancel01Icon} className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 bg-gradient-to-b from-[#FAF7F1]/30 to-[#FAF7F1] flex flex-col gap-3 custom-scrollbar">
          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center">
              <HugeiconsIcon icon={Loading01Icon} className="w-8 h-8 animate-spin text-kat-primary" />
              <span className="text-xs text-kat-muted mt-2">Đang tải tin nhắn...</span>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 select-none">
              <div className="w-16 h-16 rounded-full bg-kat-primary-soft flex items-center justify-center mb-3">
                <HugeiconsIcon icon={BubbleChatIcon} className="w-8 h-8 text-kat-primary-usable" />
              </div>
              <h4 className="font-bold text-kat-text text-sm mb-1">Chưa có tin nhắn nào</h4>
              <p className="text-xs text-kat-muted max-w-[200px]">Hãy là người đầu tiên gửi lời chào trong nhóm trò chuyện!</p>
            </div>
          ) : (
            messages.map((msg, index) => {
              const isMe = msg.senderName === currentUser.name;
              const showAvatar = !isMe && (index === 0 || messages[index - 1].senderName !== msg.senderName);
              
              const dateStr = getMessageDateString(msg.createdAt);
              const showDateSeparator = index === 0 || getMessageDateString(messages[index - 1].createdAt) !== dateStr;
              const msgKey = msg.id || index.toString();
              const isTimeVisible = !!visibleTimes[msgKey];
              
              return (
                <React.Fragment key={msg.id || index}>
                  {showDateSeparator && (
                    <div className="flex items-center justify-center my-3 select-none">
                      <div className="bg-[#E8E1D8]/60 text-kat-text text-[10px] font-bold px-3 py-1 rounded-full shadow-sm tracking-wider uppercase border border-kat-border/40">
                        {dateStr}
                      </div>
                    </div>
                  )}
                  
                  <div 
                    className={classNames(
                      "flex max-w-[85%] group mb-0.5",
                      isMe ? "ml-auto flex-row-reverse" : "mr-auto"
                    )}
                  >
                    {!isMe && (
                      <div className={classNames(
                        "w-8 h-8 rounded-full shrink-0 mr-2 mt-auto",
                        showAvatar && msg.senderAvatar 
                          ? "overflow-hidden bg-[#E8E1D8]/40 border border-kat-border/60 shadow-sm transition-transform duration-200 hover:scale-110" 
                          : ""
                      )}>
                        {showAvatar ? renderSenderAvatar(msg.senderName) : null}
                      </div>
                    )}
                    
                    <div className={classNames(
                      "flex flex-col",
                      isMe ? "items-end" : "items-start"
                    )}>
                      {!isMe && showAvatar && (
                        <span className="text-xs font-semibold text-kat-text mb-1 ml-1 select-none">{msg.senderName}</span>
                      )}
                      
                      <div 
                        onClick={() => toggleTime(msgKey)}
                        className={classNames(
                          "px-4 py-2.5 rounded-2xl relative transition-all duration-200 break-words max-w-full shadow-sm cursor-pointer",
                          isMe 
                            ? "bg-gradient-to-br from-kat-primary to-kat-primary-usable text-white rounded-tr-none hover:-translate-x-0.5" 
                            : "bg-white text-kat-text border border-kat-border/50 rounded-tl-none hover:translate-x-0.5"
                        )}
                      >
                        <p className="text-[13px] leading-relaxed whitespace-pre-wrap break-words">{msg.text}</p>
                      </div>
                      
                      <div className={classNames(
                        "overflow-hidden transition-all duration-200 ease-in-out select-none",
                        isTimeVisible ? "max-h-5 opacity-100 mt-1" : "max-h-0 opacity-0"
                      )}>
                        <span className="text-[9px] text-kat-muted mx-1.5">
                          {formatTime(msg.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                </React.Fragment>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        {isReadOnly ? (
          <div className="p-3.5 bg-slate-50 border-t border-kat-border text-center text-[12px] font-bold text-slate-400 select-none flex items-center justify-center gap-1.5 shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-300 animate-pulse" />
            Chuyến đi đã kết thúc &mdash; Chỉ xem trò chuyện
          </div>
        ) : (
          <form 
            onSubmit={handleSend}
            className="p-3 bg-white border-t border-kat-border flex items-center gap-2 shrink-0 shadow-[0_-4px_12px_rgba(3,13,46,0.02)]"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Nhập tin nhắn..."
              className="flex-1 bg-kat-bg/40 border border-kat-border/60 rounded-full px-4 py-2 text-xs text-kat-text placeholder-kat-muted/65 focus:outline-none focus:ring-2 focus:ring-kat-primary/30 focus:border-kat-primary focus:bg-white transition-all duration-200"
            />
            <button
              type="submit"
              disabled={!inputText.trim() || sending}
              className="w-9 h-9 rounded-full bg-gradient-to-r from-kat-primary to-kat-primary-usable text-white flex items-center justify-center hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100 disabled:active:scale-100 transition-all duration-200 shrink-0 shadow-md shadow-kat-primary/10"
            >
              {sending ? (
                <HugeiconsIcon icon={Loading01Icon} className="w-4 h-4 animate-spin" />
              ) : (
                <HugeiconsIcon icon={SentIcon} className="w-4 h-4 ml-0.5" />
              )}
            </button>
          </form>
        )}
      </div>
    );
  };

  if (inline) {
    return (
      <>
        {/* Fullscreen Chat Modal on Mobile */}
        {isMobileModalOpen && (
          <div className="fixed inset-0 bg-white z-[999] flex flex-col animate-slideUp">
            {renderChatContent(true, () => setIsMobileModalOpen(false))}
          </div>
        )}

        {/* Responsive Layout wrapper */}
        <div className="w-full">
          {/* Mobile View: Invitation CTA Card */}
          <div className="block sm:hidden bg-white border border-kat-border rounded-[24px] p-6 shadow-soft text-center flex flex-col items-center justify-center h-[280px]">
            <div className="w-16 h-16 rounded-full bg-kat-primary-soft flex items-center justify-center mb-4 relative">
              <HugeiconsIcon icon={BubbleChatIcon} className="w-7 h-7 text-kat-primary animate-pulse" />
              <span className="absolute -top-0.5 -right-0.5 flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500"></span>
              </span>
            </div>
            <h4 className="font-bold text-kat-text text-base tracking-wide">Trò Chuyện Nhóm</h4>
            <p className="text-xs text-kat-muted mt-1 mb-5 leading-relaxed">
              Bạn đang kết nối dưới tên: <strong className="text-kat-text font-semibold">{currentUser.name}</strong>
            </p>
            <button
              onClick={() => setIsMobileModalOpen(true)}
              className="bg-gradient-to-r from-kat-primary to-kat-primary-usable text-white px-8 py-3 rounded-full font-bold shadow-md hover:scale-105 active:scale-95 transition-all text-xs tracking-wider uppercase"
            >
              Mở cuộc trò chuyện
            </button>
          </div>

          {/* Desktop View: Standard Embedded ChatBox */}
          <div className="hidden sm:flex flex-col w-full h-[550px] sm:h-[650px] rounded-[24px] border border-kat-border shadow-soft overflow-hidden">
            {renderChatContent(false)}
          </div>
        </div>
      </>
    );
  }

  // Floating button drawer view (if applicable)
  return (
    <>
      {/* Mobile view: Fullscreen overlay */}
      <div className="block sm:hidden">
        <div className="fixed inset-0 bg-white z-[999] flex flex-col">
          {renderChatContent(true, onClose)}
        </div>
      </div>

      {/* Desktop view: Standard floating card */}
      <div className="hidden sm:flex fixed bottom-4 right-4 sm:bottom-6 sm:right-6 w-[350px] sm:w-[400px] h-[550px] max-h-[80vh] rounded-[24px] shadow-floating border border-kat-border z-50 flex-col overflow-hidden animate-slideUp">
        {renderChatContent(false, onClose)}
      </div>
    </>
  );
}
