
Before optimization

```
text_size 131072
fragment_size 16384
merges_count 2048
train_time_ms 2378.550258
encode_time_ms 2159.596827
decode_time_ms 0.31989
pair_tokens 4286
language mojo
```

Tokenizer

```
from hashlib.hasher import Hasher

@fieldwise_init
struct UInt16Pair(Copyable, Movable, Hashable, EqualityComparable, Writable):
    var a: UInt16
    var b: UInt16

    fn __eq__(self, other: Self) -> Bool:
        return self.a == other.a and self.b == other.b

    fn __ne__(self, other: Self) -> Bool:
        return self.a != other.a or self.b != other.b

    fn __is__(self, other: NoneType) -> Bool:
        return False

    fn __hash__[H: Hasher](self, mut hasher: H):
        hasher.update(self.a)
        hasher.update(self.b)

    fn write_to[W: Writer](self, mut writer: W):
        var string = "Pair"
        # Write a single `Span[Byte]`:
        writer.write_bytes(string.as_bytes())
        # Pass multiple args that can be converted to a `Span[Byte]`:
        writer.write("(", self.a, ", ", self.b, ")")


struct Tokenizer():
    @staticmethod
    fn _string_to_utf8_bytes(text: String) -> List[UInt16]:
        var byte_list = List[UInt16]()
        var raw = text.as_bytes()
        for b in raw:
    #         // convert signed byte to unsigned
            var ub: UInt16 = UInt16(b)
            byte_list.append(ub)
        return byte_list

    @staticmethod
    fn _map_to_int(items: List[UInt16]) -> List[Int]:
        var result = List[Int]()
        for item in items:
            result.append(Int(item))
        return result

    @staticmethod
    fn _get_stats(ids: List[UInt16]) -> Dict[UInt16Pair, Int]:
        var counts: Dict[UInt16Pair, Int] = Dict[UInt16Pair, Int]()

        var n = ids.__len__()
        if n < 2:
            return counts

        for i in range(n - 1):
            var pair = UInt16Pair(ids[i], ids[i + 1])
            var current = counts.get(pair, 0)
            counts[pair] = current + 1

        return counts

    @staticmethod
    fn _get_max_pair(stats: Dict[UInt16Pair, Int]) -> Optional[UInt16Pair]:
        var max_count = 0
        var max_pair: Optional[UInt16Pair] = None

        for e in stats.items():
            if e.value > max_count:
                max_count = e.value
                max_pair = e.key

        return max_pair

    @staticmethod
    def _merge(ids: List[UInt16], pair: UInt16Pair, idx: UInt16) -> List[UInt16]:
      var newids: List[UInt16] = List[UInt16]()
      var i: Int = 0
      while i < len(ids):
        if i < len(ids) - 1 and ids[i] == pair.a and ids[i+1] == pair.b:
          newids.append(idx)
          i += 2
        else:
          newids.append(ids[i])
          i += 1
      return newids

    @staticmethod
    def _get_min_pair_by_merges(
        stats: Dict[UInt16Pair, Int],
        merges: Dict[UInt16Pair, Int]
    ) -> Optional[UInt16Pair]:
        for merge in merges.keys():
            for stat in stats.keys():
                if merge == stat:
                    return merge
        return None

    @staticmethod
    fn _to_byte_list(u8s: List[UInt8]) -> List[Byte]:
        var bytes = List[Byte](capacity=len(u8s))
        for u in u8s:
            bytes.append(Byte(u))  # Convert UInt8 → Byte (SIMD[uint8, 1])
        return bytes

    var merges: Dict[UInt16Pair, Int] # (int, int) -> int
    var vocab: Dict[Int, List[UInt8]]

    fn __init__(out self):
        self.merges = Dict[UInt16Pair, Int]() # (int, int) -> int
        self.vocab = Dict[Int, List[UInt8]]()

    def train(mut self, text: String, vocab_size: Int, verbose: Bool = False) -> None:
        var tokens = Tokenizer._string_to_utf8_bytes(text)
#         print(Tokenizer._map_to_int(tokens).__str__())
        var ids: List[UInt16] = tokens # copy so we don't destroy the original list

        var num_merges = vocab_size - 256

        for i in range(num_merges):
            var stats = Tokenizer._get_stats(ids)
            var pair: Optional[UInt16Pair] = Tokenizer._get_max_pair(stats)
            if not pair:
                break
            idx = 256 + i
            if verbose:
                print("merging ",pair.value()," into a new token ", idx)
            ids = Tokenizer._merge(ids, pair.value(), idx)
            self.merges[pair.value()] = idx


        for idx in range(256):
            self.vocab[idx] = [idx]
        for merge_item in self.merges.items(): # (p0, p1), idx
            var cp = self.vocab[Int(merge_item.key.a)].copy()
            cp.extend(self.vocab[Int(merge_item.key.b)])
            self.vocab[merge_item.value] = cp

    def encode(self, text: String) -> List[UInt16]:
      tokens = Tokenizer._string_to_utf8_bytes(text)
      while len(tokens) >= 2:
        stats = Tokenizer._get_stats(tokens)
        var pair: Optional[UInt16Pair] = Tokenizer._get_min_pair_by_merges(
            stats,
            self.merges
        )
        if not pair:
          break # nothing else can be merged
        var idx = self.merges[pair.value()]
        tokens = Tokenizer._merge(tokens, pair.value(), idx)
      return tokens

    def decode(self, ids: List[UInt16]) -> String:
        var text = String()
        for idx in ids:
            var u8_list = self.vocab[Int(idx)]  # List[UInt8]
            var byte_list = Tokenizer._to_byte_list(u8_list)  # List[Byte]
            text.write_bytes(byte_list)  # Now it's Span[Byte]

        return text
```