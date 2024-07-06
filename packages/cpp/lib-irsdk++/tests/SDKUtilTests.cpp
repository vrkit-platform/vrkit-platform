#include <IRacingTools/SDK/Utils/Base64.h>
#include <IRacingTools/SDK/Utils/LUT.h>
#include <IRacingTools/SDK/Utils/Singleton.h>
#include <IRacingTools/SDK/Utils/Traits.h>
#include <gtest/gtest.h>
#include <fmt/core.h>

using namespace IRacingTools::SDK::Utils;

constexpr LUT<std::string_view, int, 2> testMap = {{"t1", 0},{"t2", 1}};

TEST(Base64Tests, string_encode_decode) {
    const std::string original = "test1234";
    auto encoded = Base64::encode(original);
    auto decoded = Base64::decode(encoded);

    EXPECT_EQ(decoded, original);
    EXPECT_NE(decoded, encoded);
}


TEST(LUTTests, map_test) {
    EXPECT_EQ(testMap.lookup("t1"), 0);
    EXPECT_EQ(testMap["t1"], 0);
    EXPECT_EQ(testMap["t2"], 1);

    auto values = testMap.values();
    EXPECT_EQ(values[1], 1);
}


TEST(SingletonTests, singleton_test) {
    class Singleton1 final : public Singleton<Singleton1> {

    friend Singleton;

    Singleton1() = default;
    explicit Singleton1(token) {};

    public:
        Singleton1(const Singleton1 &other) = delete;
        Singleton1(Singleton1 &&other) noexcept = delete;
        Singleton1 & operator=(const Singleton1 &other) = delete;
        Singleton1 & operator=(Singleton1 &&other) noexcept = delete;

        std::string sayHello(const std::string& name) {
            return fmt::format("Hello {}!", name);
        }
    };

    auto& instance = Singleton1::GetInstance();
    EXPECT_EQ(instance.sayHello("jon"), "Hello jon!");

    auto& instance2 = Singleton1::GetInstance();
    EXPECT_EQ(&instance, &instance2);
}


TEST(TraitTests, is_container) {
    // std::vector<int> vints = {0,123};

    EXPECT_EQ(is_container<std::vector<int>>, true);
    EXPECT_EQ(is_container<int>, false);
}