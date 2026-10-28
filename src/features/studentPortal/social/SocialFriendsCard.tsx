import React, { useState } from 'react';
import { Gift, UserPlus, Users } from 'lucide-react';
import { Button, Card } from '../../../components/ui';
import { getPokemonArtworkUrl, handlePokemonArtworkError } from '../../../domain/pokemonProgression';
import { SocialOverview } from '../../../domain/social';
import { SocialActions } from './useStudentSocial';

// Bạn bè: lời mời đến, bạn bè (tặng quà), lời mời đã gửi, bạn cùng lớp để kết bạn.
// Không hiện điểm, số bạn hay xếp hạng của ai (6.5): chỉ tên và Pokémon đồng hành.

interface SocialFriendsCardProps {
  overview: SocialOverview;
  busy: boolean;
  actions: SocialActions;
  onGift: (friendId: string) => void;
}

const PetIcon: React.FC<{ dexId?: number; name: string }> = ({ dexId, name }) => {
  if (!dexId) return <span aria-hidden className="grid h-10 w-10 place-items-center rounded-full bg-[#f3e9fa] text-lg">🌱</span>;
  const pet = { dexId, name, types: [], accessories: [], skills: [] };
  return <img src={getPokemonArtworkUrl(pet)} onError={e => handlePokemonArtworkError(e, pet)} alt="" className="h-10 w-10 object-contain" loading="lazy" referrerPolicy="no-referrer" />;
};

const Row: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <li className="flex min-h-14 items-center justify-between gap-3 py-2">{children}</li>
);

/** Lời mời kết bạn đến: dùng ở trang Bạn bè và ở đầu Hồ sơ (Phase 12A). Không có lời mời thì không hiện gì. */
export const IncomingRequests: React.FC<{ incoming: SocialOverview['incoming']; busy: boolean; actions: SocialActions; className?: string }> = ({ incoming, busy, actions, className }) => {
  if (incoming.length === 0) return null;
  return (
    <section aria-label="Lời mời kết bạn" className={`rounded-brand-md bg-[#f3e9fa] p-3 ${className ?? ''}`}>
      <p className="text-[13px] font-bold text-brand-violet-deep">Lời mời kết bạn</p>
      <ul>
        {incoming.map(request => (
          <Row key={request.requestId}>
            <span className="min-w-0 truncate font-bold text-brand-ink">{request.name}</span>
            <span className="flex shrink-0 gap-2">
              <Button size="md" disabled={busy} onClick={() => actions.respond(request.requestId, true)}>Đồng ý</Button>
              <Button size="md" variant="ghost" disabled={busy} onClick={() => actions.respond(request.requestId, false)}>Từ chối</Button>
            </span>
          </Row>
        ))}
      </ul>
    </section>
  );
};

export const SocialFriendsCard: React.FC<SocialFriendsCardProps> = ({ overview, busy, actions, onGift }) => {
  const [showClassmates, setShowClassmates] = useState(false);
  const { friends, incoming, outgoing, classmates } = overview;

  return (
    <Card>
      <h2 className="mb-3 flex items-center gap-2 text-lg font-extrabold text-brand-ink">
        <Users size={20} className="text-brand-violet" aria-hidden /> Bạn bè
      </h2>

      <IncomingRequests incoming={incoming} busy={busy} actions={actions} className="mb-4" />

      {friends.length === 0 ? (
        <p className="text-base text-brand-ink/70">Em chưa có bạn bè trên Classivy. Gửi lời mời cho bạn cùng lớp nhé!</p>
      ) : (
        <ul className="divide-y divide-[#ebe8dc]">
          {friends.map(friend => (
            <Row key={friend.id}>
              <span className="flex min-w-0 items-center gap-3">
                <PetIcon dexId={friend.petDexId} name={friend.name} />
                <span className="truncate font-bold text-brand-ink">{friend.name}</span>
              </span>
              <span className="flex shrink-0 gap-1">
                <Button size="md" variant="secondary" icon={<Gift size={18} className="text-brand-violet" />} disabled={busy} onClick={() => onGift(friend.id)}>Tặng quà</Button>
                <Button size="md" variant="ghost" disabled={busy} aria-label={`Thôi làm bạn với ${friend.name}`}
                  onClick={() => { if (window.confirm(`Thôi làm bạn với ${friend.name}?`)) actions.remove(friend.id); }}>Bỏ</Button>
              </span>
            </Row>
          ))}
        </ul>
      )}

      {outgoing.length > 0 && (
        <section aria-label="Lời mời đã gửi" className="mt-4">
          <p className="text-[13px] font-bold text-brand-ink/70">Đang chờ bạn trả lời</p>
          <ul>
            {outgoing.map(request => (
              <Row key={request.requestId}>
                <span className="min-w-0 truncate text-brand-ink">{request.name}</span>
                <Button size="md" variant="ghost" disabled={busy} onClick={() => actions.remove(request.id)}>Huỷ lời mời</Button>
              </Row>
            ))}
          </ul>
        </section>
      )}

      {classmates.length > 0 && (
        <section aria-label="Bạn cùng lớp" className="mt-4 border-t border-[#ebe8dc] pt-3">
          <Button variant="ghost" size="md" icon={<UserPlus size={18} />} aria-expanded={showClassmates} onClick={() => setShowClassmates(v => !v)}>
            {showClassmates ? 'Ẩn bạn cùng lớp' : `Kết bạn với bạn cùng lớp (${classmates.length})`}
          </Button>
          {showClassmates && (
            <ul className="mt-1 grid gap-x-4 sm:grid-cols-2">
              {classmates.map(person => (
                <Row key={person.id}>
                  <span className="min-w-0 truncate text-brand-ink">{person.name}</span>
                  <Button size="md" variant="secondary" disabled={busy} onClick={() => actions.invite(person.id)}>Kết bạn</Button>
                </Row>
              ))}
            </ul>
          )}
        </section>
      )}
    </Card>
  );
};
