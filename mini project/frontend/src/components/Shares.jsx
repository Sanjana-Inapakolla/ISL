export default function Shares({ share1, share2 }) {
  return (
    <div className="shares-list">
      <h3>Share 1</h3>
      <img src={share1} className="share-img" alt="Share 1" />

      <h3>Share 2</h3>
      <img src={share2} className="share-img" alt="Share 2" />
    </div>
  );
}
