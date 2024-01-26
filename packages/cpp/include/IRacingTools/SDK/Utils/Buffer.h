//
// Created by jglanz on 1/25/2024.
//

#pragma once

#include <array>
#include <ranges>
#include <vector>
#include <type_traits>

#include "Traits.h"

namespace IRacingTools::SDK::Utils {
template<typename Storage, typename = std::enable_if<is_container<Storage>>
>
class Buffer {
public:
    using ValueType = typename Storage::value_type;
    using SizeType = typename Storage::size_type;

    Buffer() = default;
    virtual ~Buffer() = default;

    virtual ValueType* data() {
        return getStorage().data();
    }

    virtual SizeType size() {
        return getStorage().size();
    }

protected:
    virtual Storage& getStorage() = 0;
};

template<std::size_t N, typename T = BYTE>
class FixedBuffer : public Buffer<std::array<T,N>> {
using Storage = std::array<T,N>;
public:
    FixedBuffer() {
        clear();
    };

    void clear() {
        storage_.fill(0);
    }

protected:
    Storage& getStorage() override {
        return storage_;
    }

private:
    Storage storage_{};
};
}