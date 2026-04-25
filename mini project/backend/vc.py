from PIL import Image
import numpy as np
import math

def bytes_to_bitmap(data: bytes):
    """Convert bytes into a monochrome (1-bit) NumPy array."""
    arr = np.frombuffer(data, dtype=np.uint8)
    # Unpack all bits: each byte → 8 bits, MSB first
    bits = np.unpackbits(arr)  # shape: (len(data)*8,)

    total_bits = len(bits)
    width = int(math.ceil(math.sqrt(total_bits)))
    height = int(math.ceil(total_bits / width))

    # Pad to fill the rectangle
    padding = width * height - total_bits
    if padding:
        bits = np.concatenate([bits, np.zeros(padding, dtype=np.uint8)])

    # Reshape and convert to bool (1=white, 0=black)
    return bits.reshape(height, width).astype(bool)

def generate_shares(image_or_bytes):
    """
    Generate two visual-cryptography shares using vectorized NumPy ops.
    Each pixel expands to a 2×2 block. Uses ~10-100× less time than
    the pixel-by-pixel putpixel approach.
    """
    if isinstance(image_or_bytes, bytes):
        # Boolean bitmap: True=white, False=black
        bitmap = bytes_to_bitmap(image_or_bytes)
    else:
        arr = np.array(image_or_bytes.convert('1'))
        bitmap = arr.astype(bool)

    height, width = bitmap.shape

    # ---------------------------------------------------------------
    # Vectorized share generation
    # ---------------------------------------------------------------
    # For each pixel, randomly pick which of the two sub-patterns to assign
    # to share1 vs share2.
    #   White pixel  → both shares get the SAME 2×2 pattern  [1,0,0,1]
    #   Black pixel  → shares get COMPLEMENTARY patterns [1,0,0,1] / [0,1,1,0]
    #
    # We represent each 2×2 block as 4 values laid out in row-major order:
    #   idx 0=top-left, 1=top-right, 2=bottom-left, 3=bottom-right

    # Random coin flip per pixel (True = swap)
    rng = np.random.default_rng()
    swap = rng.integers(0, 2, size=(height, width), dtype=bool)

    # Base pattern (same for all pixels in both shares before swap):
    #   p_base = [1, 0, 0, 1]  →  top-left & bottom-right are white(1)
    # Complement:
    #   p_comp = [0, 1, 1, 0]  →  the opposite

    # Build share arrays: shape (height, width, 4) – 4 sub-pixels per pixel
    # We'll store 0/1 where 1=white (PIL '1' mode: putdata uses 0=black,255=white)

    s1 = np.zeros((height, width, 4), dtype=np.uint8)
    s2 = np.zeros((height, width, 4), dtype=np.uint8)

    # Base pattern indices in the 2×2 block
    base = np.array([1, 0, 0, 1], dtype=np.uint8)
    comp = np.array([0, 1, 1, 0], dtype=np.uint8)

    # White pixels: both shares get the base pattern (possibly swapped, but same)
    white = bitmap          # (H, W) bool
    black = ~bitmap

    # ---- Share 1 ----
    # White, no swap → base
    mask = white & ~swap
    s1[mask] = base
    # White, swap → comp  (swapping white still gives same visual, but we swap for randomness)
    mask = white & swap
    s1[mask] = comp
    # Black, no swap → base
    mask = black & ~swap
    s1[mask] = base
    # Black, swap → comp
    mask = black & swap
    s1[mask] = comp

    # ---- Share 2 ----
    # White, no swap → base  (same as share1 → overlaid = white)
    mask = white & ~swap
    s2[mask] = base
    # White, swap → comp  (same as share1 → overlaid = white)
    mask = white & swap
    s2[mask] = comp
    # Black, no swap → comp  (complement of share1 → overlaid = black)
    mask = black & ~swap
    s2[mask] = comp
    # Black, swap → base  (complement of share1 → overlaid = black)
    mask = black & swap
    s2[mask] = base

    # ---------------------------------------------------------------
    # Expand 2×2 blocks into full image arrays
    # s1/s2 shape: (H, W, 4) where the 4 values map to:
    #   [0]=top-left [1]=top-right [2]=bottom-left [3]=bottom-right
    # ---------------------------------------------------------------
    # Rearrange to (H, W, 2, 2) then interleave rows/cols
    s1_blocks = s1.reshape(height, width, 2, 2)   # (H, W, row_in_block, col_in_block)
    s2_blocks = s2.reshape(height, width, 2, 2)

    # Interleave: transpose to (H, 2, W, 2) then reshape to (2H, 2W)
    out1 = s1_blocks.transpose(0, 2, 1, 3).reshape(height * 2, width * 2)
    out2 = s2_blocks.transpose(0, 2, 1, 3).reshape(height * 2, width * 2)

    # Convert 0/1 → 0/255 for PIL
    out1_img = Image.fromarray((out1 * 255).astype(np.uint8), mode='L').convert('1')
    out2_img = Image.fromarray((out2 * 255).astype(np.uint8), mode='L').convert('1')

    return out1_img, out2_img