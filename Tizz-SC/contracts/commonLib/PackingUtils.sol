// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

/**
 * @custom:version 6.4
 */
library PackingUtils {
    function pack(
        uint256[] memory values,
        uint256[] memory bitLengths
    ) external pure returns (uint256 packed) {
        uint256 length = values.length;
        require(length > 0, "INVALID_ARRAY_LENGTH");
        require(
            length == bitLengths.length,
            "Mismatch in the lengths of values and bitLengths arrays"
        );

        uint256 currentShift;

        for (uint256 i; i < length; ++i) {
            require(
                currentShift + bitLengths[i] <= 256,
                "Packed value exceeds 256 bits"
            );

            uint256 maxValue = (1 << bitLengths[i]) - 1;
            require(
                values[i] <= maxValue,
                "Value too large for specified bit length"
            );

            uint256 maskedValue = values[i] & maxValue;
            packed |= maskedValue << currentShift;
            currentShift += bitLengths[i];
        }
    }

    function unpack(
        uint256 packed,
        uint256[] memory bitLengths
    ) external pure returns (uint256[] memory values) {
        uint256 length = bitLengths.length;
        values = new uint256[](length);
        if (length == 0) {
            return values;
        }

        uint256 currentShift;
        for (uint256 i; i < length; ++i) {
            require(
                currentShift + bitLengths[i] <= 256,
                "Unpacked value exceeds 256 bits"
            );

            uint256 maxValue = (1 << bitLengths[i]) - 1;
            uint256 mask = maxValue << currentShift;
            values[i] = (packed & mask) >> currentShift;

            currentShift += bitLengths[i];
        }
    }

    function unpack256To64(
        uint256 packed
    ) external pure returns (uint64 a, uint64 b, uint64 c, uint64 d) {
        if (packed == 0) {
            return (0, 0, 0, 0);
        } else {
            uint64 delta = uint64(packed) / 100; // delta 1%
            a = uint64(packed);
            b = a + delta;
            c = a - delta;
            d = 0;
        }
    }

    // Function-specific unpacking utils
    function unpackTriggerOrder(
        uint256 packed
    )
        external
        pure
        returns (
            uint256 a,
            address b,
            uint256 c,
            uint256 d,
            uint256 e,
            uint256 f
        )
    {
        a = packed & 0xFF; // 8 bits
        b = address(uint160(packed >> 8)); // 160 bits
        c = (packed >> 168) & 0xFFFF; // 16 bits
        d = (packed >> 184) & 0xFFFF; // 16 bits
        e = (packed >> 200) & 0xFFFF; // 16 bits
        f = (packed >> 216) & 0xFFFF; // 16 bits
    }

    function packTriggerOrder(
        uint256 a,
        uint256 b,
        uint256 c,
        uint256 d,
        uint256 e,
        uint256 f
    ) external pure returns (uint256 packed) {
        packed = 0;
        packed = a & 0xFF;
        packed |= b << 8;
        packed |= c << 168;
        packed |= d << 184;
        packed |= e << 200;
        packed |= f << 216;

        return packed;
    }
}
