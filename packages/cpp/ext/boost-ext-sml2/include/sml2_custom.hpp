//
// Copyright (c) 2023-2024 Kris Jusiak (kris at jusiak dot net)
//
// Distributed under the Boost Software License, Version 1.0.
// (See accompanying file LICENSE_1_0.txt or copy at
// http://www.boost.org/LICENSE_1_0.txt)
//
#if __cplusplus < 202002L
#error "SML2 requires C++20 support (Clang-15+, GCC-12+), current " __cplusplus
#else
#if defined(__cpp_modules)
export module sml;
export  // namespace
#else
#ifndef SML2
#define SML2 2'0'0
#pragma GCC system_header  // -Wnon-template-friend
#endif

// clang-format off
/**
 * SML2 - UML Declarative Domain Specific Language (DSL)
 * - C++20 single header/module - https://raw.githubusercontent.com/boost-ext/sml2/main/sml2
 * - No dependencies (Neither Boost nor STL is required)
 * - No 'virtual' used (-fno-rtti)
 * - No `exceptions` required (-fno-exceptions)
 * - Library tests itself at compile-time upon include/import
 * - Basically guaranteed no UB, no leaks
 * - Optimized run-time execution - https://godbolt.org/z/j51Tch6PT
 * - Fast compilation times - https://github.com/boost-ext/sml2/blob/main/.github/images/sml2.perf.png
 */
// clang-format on
namespace sml::inline v_2_0_0 {
namespace meta {
template <class...>
struct type_list {};
template<class... Ts> struct inherit : Ts... {};
template <int...>
struct index_sequence {};
template <class T, T... Ns>
using integer_sequence = index_sequence<Ns...>;
template <auto N>
using make_index_sequence =
#if __has_builtin(__make_integer_seq)
    __make_integer_seq<integer_sequence, decltype(N), N>;
#elif __has_builtin(__integer_pack)
    index_sequence<__integer_pack(N)...>;
#endif
static_assert(__is_same(index_sequence<>, make_index_sequence<0>));
static_assert(__is_same(index_sequence<0>, make_index_sequence<1>));
static_assert(__is_same(index_sequence<0,1>, make_index_sequence<2>));

template <class... T, template <class...> class TList, class... Ts>
auto append(TList<Ts...>) -> TList<Ts..., T...>;
static_assert(__is_same(type_list<int>, decltype(append<int>(type_list{}))));
static_assert(__is_same(type_list<int, float>, decltype(append<int, float>(type_list{}))));
static_assert(__is_same(type_list<int, float>, decltype(append<float>(type_list<int>{}))));
static_assert(__is_same(type_list<float, int>, decltype(append<int>(type_list<float>{}))));

template <class T>
auto declval() -> T&&;

template <auto Size>
struct fixed_string {
  static constexpr auto size = Size;

  constexpr fixed_string() = default;
  constexpr explicit(false) fixed_string(const char (&str)[Size]) {
    for (auto i = 0u; i < Size; ++i) {
      data[i] = str[i];
    }
  }

  char data[Size]{};
};

template <auto Size> fixed_string(const char (&)[Size]) -> fixed_string<Size>;

static_assert(sizeof("") == fixed_string("").size);
static_assert(sizeof("foo") == fixed_string("foo").size);
static_assert('f' == fixed_string("foo").data[0]);
static_assert('o' == fixed_string("foo").data[1]);
static_assert('o' == fixed_string("foo").data[2]);
}  // namespace meta

namespace back {
struct on_entry {};
struct on_exit {};
template <class... Ts>
struct pool : Ts... {
  constexpr explicit(true) pool(Ts... ts) : Ts{ts}... {}
};

template <class...> class sm;
template <template <class...> class TList, class... Transitions>
class sm<TList<Transitions...>> {
  static constexpr auto num_of_regions = (Transitions::initial + ...);

  template<class> struct state_id {
    int id{};
  };
  template<class... Ts>
  struct state_ids final : state_id<Ts>... {
    constexpr explicit(false) state_ids(int i = {}) : state_id<Ts>{i++}... { }
    template<class T> [[nodiscard]] consteval auto get() const {
      return static_cast<state_id<T>>(*this).id;
    }
  };
  template<auto> struct state {
    consteval auto friend get(state);
  };
  template <auto N, class T>
  struct prediction final {
    static constexpr auto next = N;
    using type = T;
  };
  template <class, auto>
  struct cache final {
    consteval auto friend get(cache);
  };
  template <class, auto>
  struct predict final {
    consteval auto friend get(predict);
  };
  template <class T, class R>
  struct assign final {
    consteval auto friend get(T) { return R{}; }
  };

  template <class TEvent, class T, auto N, auto I = 0>
  static consteval auto set_transition_impl() {
    if constexpr (requires { get(predict<TEvent, N>{}); }) {
      using predicted = decltype(get(predict<TEvent, N>{}));
      using updated = decltype(meta::append<T>(typename predicted::type{}));
      assign<cache<TEvent, predicted::next>, updated>();
      assign<predict<TEvent, N + 1>, prediction<predicted::next + 1, updated>>();
    } else if constexpr (requires { get(cache<TEvent, I>{}); }) {
      set_transition_impl<TEvent, T, N, I + 1>();
    } else if constexpr (not I) {
      assign<cache<TEvent, I>, meta::type_list<T>>();
      assign<predict<TEvent, N + 1>, prediction<I + 1, meta::type_list<T>>>();
    } else {
      using updated = decltype(meta::append<T>(get(cache<TEvent, I - 1>{})));
      assign<cache<TEvent, I>, updated>();
      assign<predict<TEvent, N + 1>, prediction<I + 1, updated>>();
    }
  }

  template <class T, auto N, class... TEvents>
  static consteval auto set_transition(meta::type_list<TEvents...>) {
    (set_transition_impl<TEvents, T, N>(), ...);
    return N;
  }

  template <class TEvent, auto I = 1>
  [[nodiscard]] static consteval auto get_transitions() {
    if constexpr (requires { get(cache<TEvent, I>{}); }) {
      return get_transitions<TEvent, I + 1>();
    } else if constexpr (requires { get(cache<TEvent, I - 1>{}); }) {  // can be unexpected
      return get(cache<TEvent, I - 1>{});
    }
  }

  template<auto N, class T>
  static constexpr auto set_state() {
    if constexpr (N == 0) {
      assign<state<N>, meta::inherit<T>>();
    } else if constexpr (constexpr auto states = get(state<N-1>{}); __is_base_of(T, decltype(states))) {
      assign<state<N>, decltype(states)>();
    } else {
      assign<state<N>, decltype(meta::append<T>(states))>();
    }
    return N;
  }

  static_assert(
    ([]<auto... Ns>(meta::index_sequence<Ns...>) {
      []<auto...>{}.template operator()<
        set_transition<Transitions, Ns>(typename Transitions::event{})...,
        set_state<Ns, typename Transitions::src>()...,
        set_state<Ns + int(sizeof...(Ns)), typename Transitions::dst>()...
      >();
    }(meta::make_index_sequence<sizeof...(Transitions)>{}), true)
  );

 public:
  static constexpr auto states = get(state<int(sizeof...(Transitions))*2-1>{});
  static constexpr auto ids = []<class... Ts>(meta::inherit<Ts...>) { return state_ids<Ts...>{}; }(states);

  template<class TransitionTable>
  constexpr explicit(true) sm(TransitionTable&& transition_table)
      : transition_table_{static_cast<TransitionTable&&>(transition_table)} {
    init();
    start();
  }

  template <class TEvent, const auto transitions = get_transitions<TEvent>()>
  constexpr auto process_event(const TEvent& event, auto&&... args) -> bool {
    if constexpr (num_of_regions == 0u) {
      return process_event_0<TEvent>(event, transitions, args...);
    } else if constexpr (num_of_regions == 1u) {
      return process_event_1<TEvent>(event, current_state_[0], transitions, args...);
    } else {
      return process_event_N<TEvent>(event, transitions, meta::make_index_sequence<num_of_regions>{}, args...);
    }
  }

  template<class... TStates>
  [[nodiscard]] constexpr auto is(const TStates...) const -> bool requires (num_of_regions > 0u) {
    return [this]<auto... Ns>(meta::index_sequence<Ns...>) {
      return ((ids.template get<typename TStates::src>() == current_state_[Ns]) and ...);
    }(meta::make_index_sequence<num_of_regions>{});
  }

 private:
  using state_t = decltype([]<class... Ts>(meta::inherit<Ts...>) {
    if constexpr (sizeof...(Ts) < 255) {
      return (unsigned char){};
    } else {
      return (unsigned short){};
    }
  }(states));

  constexpr auto start() {
    if constexpr (requires { process_event(back::on_entry{}); }) {
      process_event(back::on_entry{});
    }
  }

  constexpr auto init() {
    auto i = 0;
    ([&, this] {
     if constexpr (Transitions::initial) {
      current_state_[i++] = ids.template get<typename Transitions::src>();
     }
    }(), ...);
  }

  template <class TEvent, class T>
  constexpr auto process_event_0(const TEvent& event, meta::type_list<T>,
                                 auto&&... args) -> bool {
    state_t arg{};
    return static_cast<T&>(transition_table_)(event, arg, *this, args...);
  }

  template <class TEvent, class... Ts>
  constexpr auto process_event_0(const TEvent& event, meta::type_list<Ts...>, auto&&... args) -> bool {
    return (process_event_0(event, meta::type_list<Ts>{}, args...) or ...);
  }

  template <class TEvent, class T>
  constexpr auto process_event_1(const TEvent& event, auto& current_state, meta::type_list<T>, auto&&... args) -> bool {
    if constexpr (T::src::size > 1) {
      return ids.template get<typename T::src>() == current_state and static_cast<T&>(transition_table_)(event, current_state, *this, args...);
    } else { // any state
      return static_cast<T&>(transition_table_)(event, current_state, *this, args...);
    }
  }

  template <class TEvent, class... Ts>
  constexpr auto process_event_1(const TEvent& event, auto& current_state, meta::type_list<Ts...>, auto&&... args) -> bool {
    return (process_event_1(event, current_state, meta::type_list<Ts>{}, args...) or ...);
  }

  template <class TEvent, auto... Rs>
  constexpr auto process_event_N(const TEvent& event, const auto& transitions, meta::index_sequence<Rs...>, auto&&... args) -> bool {
    return (process_event_1<TEvent>(event, current_state_[Rs], transitions, args...) or ...);
  }

  [[no_unique_address]] TList<Transitions...> transition_table_{};
  [[no_unique_address]] state_t current_state_[num_of_regions ? num_of_regions : 1]{};
};
}  // namespace back

namespace front {
namespace concepts {
struct invocable_base {
  void operator()();
};
template <class T>
struct invocable_impl : T, invocable_base {};
template <class T>
concept invocable = not requires { &invocable_impl<T>::operator(); };
}  // namespace concepts

[[nodiscard]] constexpr auto invoke(const auto& fn, const auto& event,
                                    auto& self, auto&&... args) {
  if constexpr (requires { fn(event, args...); }) {
    return fn(event, args...);
  } else if constexpr (requires { fn(event); }) {
    return fn(event);
  } else if constexpr (requires { fn(self, event, args...); }) {
    return fn(self, event, args...);
  } else {
    return fn();
  }
}

constexpr void process_event(auto& self, const auto& event, auto&&... args) {
  if constexpr (requires { self.process_event(event, args...); }) {
    self.process_event(event, args...);
  }
}

namespace detail {
struct anonymous{};
constexpr auto none = [] {};
constexpr auto always = [] { return true; };
}  // namespace detail

template <const auto Initial, class TSrc, class TDst, class TEvent = detail::anonymous, class TGuard = decltype(detail::always), class TAction = decltype(detail::none)>
struct transition {
  using src = TSrc;
  using dst = TDst;
  using event = TEvent;

  static constexpr auto initial = Initial;

  [[nodiscard]] constexpr auto operator*() const {
    return transition<true, TSrc, TDst, TEvent, TGuard, TAction>{.guard = guard, .action = action};
  }

  template <class T>
  [[nodiscard]] constexpr auto operator+(const T& t) const {
    return transition<initial, TSrc, TDst, typename T::event, decltype(T::guard), decltype(T::action)>{.guard = t.guard, .action = t.action};
  }

  template <class T>
  [[nodiscard]] constexpr auto operator[](const T& guard) const {
    return transition<initial, TSrc, TDst, TEvent, T>{.guard = guard, .action = action};
  }

  template <class T>
  [[nodiscard]] constexpr auto operator/(const T& action) const {
    return transition<initial, TSrc, TDst, TEvent, TGuard, T>{.guard = guard, .action = action};
  }

  template <class T>
  [[nodiscard]] constexpr auto operator=(const T&) const {
    return transition<initial, TSrc, typename T::src, TEvent, TGuard, TAction>{.guard = guard, .action = action};
  }

  [[nodiscard]] constexpr auto operator()(const back::on_entry& event, [[maybe_unused]] auto& current_state, auto& self, auto&&... args) -> bool {
    using R = decltype(invoke(guard, event, self, args...));
    if constexpr ( requires { R::value; }) {
      if constexpr (R::value) {
        invoke(action, event, self, args...);
        static_assert(not dst::size, "[E002] on_entry can't have dst state!");
        return true;
      }
    } else {
      if (invoke(guard, event, self, args...)) {
        invoke(action, event, self, args...);
        static_assert(not dst::size, "[E002] on_entry can't have dst state!");
        return true;
      }
    }
    return false;
  }

  [[nodiscard]] constexpr auto operator()(const back::on_exit& event, [[maybe_unused]] auto& current_state, auto& self, auto&&... args) -> bool {
    using R = decltype(invoke(guard, event, self, args...));
    if constexpr ( requires { R::value; }) {
      if constexpr (R::value) {
        invoke(action, event, self, args...);
        static_assert(not dst::size, "[E003] on_exit can't have dst state!");
        return true;
      }
    } else {
      if (invoke(guard, event, self, args...)) {
        invoke(action, event, self, args...);
        static_assert(not dst::size, "[E003] on_exit can't have dst state!");
        return true;
      }
    }
    return false;
  }

  template<class TSelf>
  [[nodiscard]] constexpr auto operator()(const auto& event,
                                          [[maybe_unused]] auto& current_state,
                                          TSelf& self, auto&&... args) -> bool {
    using R = decltype(invoke(guard, event, self, args...));
    if constexpr (requires { R::value; }) {
      if constexpr (R::value) {
        if constexpr (dst::size) {
          process_event(self, back::on_exit{}, args...);
          current_state = TSelf::ids.template get<dst>();
        }
        invoke(action, event, self, args...);
        if constexpr (dst::size) {
          process_event(self, back::on_entry{}, args...);
        }
        return true;
      }
    } else {
      if (invoke(guard, event, self, args...)) {
        if constexpr (dst::size) {
          process_event(self, back::on_exit{}, args...);
          current_state = TSelf::ids.template get<dst>();
        }
        invoke(action, event, self, args...);
        if constexpr (dst::size) {
          process_event(self, back::on_entry{}, args...);
        }
        return true;
      }
    }
    return false;
  }

  [[no_unique_address]] TGuard guard;
  [[no_unique_address]] TAction action;
};

template<char... Cs> struct state {
  static constexpr auto size = sizeof...(Cs);
  static constexpr char name[]{Cs..., 0};
  static constexpr auto c_str() { return name; }
};

static_assert('f' == state<'f', 'o', 'o'>::c_str()[0]);
static_assert('o' == state<'f', 'o', 'o'>::c_str()[1]);
static_assert('o' == state<'f', 'o', 'o'>::c_str()[2]);
static_assert(0 == state<'f', 'o', 'o'>::c_str()[3]);

template <class... TEvents>
inline constexpr auto event = transition<false, state<>, state<>, meta::type_list<TEvents...>>{};
inline constexpr auto on_entry = event<back::on_entry>;
inline constexpr auto on_exit = event<back::on_exit>;

template <meta::fixed_string State>
[[nodiscard]] constexpr auto operator""_s() {
  return []<auto... Ns>(meta::index_sequence<Ns...>) {
    return transition<false, state<State.data[Ns]...>, state<>>{};
  }(meta::make_index_sequence<State.size>{});
}

[[nodiscard]] constexpr auto operator,(const concepts::invocable auto& lhs,
                                       const concepts::invocable auto& rhs) {
  return [=](auto& self, const auto& event, auto&&... args) {
    invoke(lhs, event, self, args...);
    invoke(rhs, event, self, args...);
  };
}
[[nodiscard]] constexpr auto operator and(const concepts::invocable auto& lhs,
                                          const concepts::invocable auto& rhs) {
  return [=](auto& self, const auto& event, auto&&... args) {
    return invoke(lhs, event, self, args...) and
           invoke(rhs, event, self, args...);
  };
}
[[nodiscard]] constexpr auto operator or(const concepts::invocable auto& lhs,
                                         const concepts::invocable auto& rhs) {
  return [=](auto& self, const auto& event, auto&&... args) {
    return invoke(lhs, event, self, args...) or
           invoke(rhs, event, self, args...);
  };
}
[[nodiscard]] constexpr auto operator not(const concepts::invocable auto& t) {
  return [=](auto& self, const auto& event, auto&&... args) {
    return not invoke(t, event, self, args...);
  };
}
}  // namespace front

template <class T>
struct sm final : back::sm<decltype(meta::declval<T>()())> {
  constexpr explicit(false) sm(T&& t)
      : back::sm<decltype(meta::declval<T>()())>{t()} {}
};
template <class T>
sm(T&&) -> sm<T>;

namespace dsl {
template <class... Ts>
struct transition_table final : back::pool<Ts...> {
  constexpr explicit(false) transition_table(Ts&&... ts)
      : back::pool<Ts...>{static_cast<Ts&&>(ts)...} {}
  static_assert(
      (Ts::initial + ...) >= 1,
      "[E001] At least one `*state` aka orthogonal region is required!");
};
template <class... Ts>
struct dispatch_table final : back::pool<Ts...> {
  constexpr explicit(false) dispatch_table(Ts&&... ts)
      : back::pool<Ts...>{static_cast<Ts&&>(ts)...} {}
};
using front::event;
using front::on_entry;
using front::on_exit;
using front::operator""_s;
using front::operator, ;
using front::operator not;
using front::operator and;
using front::operator or;
constexpr auto otherwise = [] { return true; };
constexpr auto _ = ""_s;   // any state
constexpr auto X = "X"_s;  // terminate state
constexpr auto process = [](const auto& event) {
  return [event](auto& self, const auto&, auto&&... args) {
    self.process_event(event, args...);
  };
};
}  // namespace dsl
}  // namespace sml::inline v_2_0_0

static_assert(
    [] {
      using namespace sml;

      struct e1 {};

      struct test {
        constexpr auto operator()() const {
          using namespace dsl;
          return transition_table{
              *"s1"_s + event<e1> = "s2"_s,
          };
        }
      };

      using dsl::operator""_s;

      test t;
      sm sm1{t};
      sm sm2{test{}};
      return sm1.is("s1"_s) and sm1.process_event(e1{}) and sm1.is("s2"_s) and
             sm2.is("s1"_s) and sm2.process_event(e1{}) and sm2.is("s2"_s);
    }(),
    "feature.ctor");

static_assert(
    [] {
      using namespace sml;

      struct e1 {};

      sm sm = [] {
        using namespace dsl;
        return transition_table{
            *"s1"_s + event<e1> = "s2"_s,
        };
      };

      using dsl::operator""_s;
      return sm.process_event(e1{}) and sm.is("s2"_s);
    }(),
    "feature.process_event");

static_assert(
    [] {
      using namespace sml;

      struct e1 {};

      int on_entry_calls{};

      sm sm = [&] {
        using namespace dsl;
        constexpr auto on_entry = dsl::on_entry;
        return transition_table{
            *"idle"_s + on_entry / [&] { ++on_entry_calls; }
        };
      };

      using dsl::operator""_s;
      return sm.is("idle"_s) and on_entry_calls == 1;
    }(),
    "feature.start[on_entry]");

static_assert(
    [] {
      using namespace sml;

      struct e1 {};
      struct e2 {};

      int on_entry_calls{};
      int on_exit_calls{};

      sm sm = [&] {
        using namespace dsl;
        constexpr auto on_entry = dsl::on_entry;
        constexpr auto on_exit = dsl::on_exit;
        return transition_table{
            *"s1"_s + event<e1> = "s2"_s,
             "s2"_s + on_entry / [&] { ++on_entry_calls; },
             "s2"_s + on_exit / [&] { ++on_exit_calls; },
             "s2"_s + event<e2> = "s3"_s,
        };
      };

      using dsl::operator""_s;
      return sm.process_event(e1{}) and sm.is("s2"_s) and on_entry_calls == 1 and on_exit_calls == 0 and
             sm.process_event(e2{}) and on_entry_calls == 1 and on_exit_calls == 1 and sm.is("s3"_s);
    }(),
    "feature.process_event[on_entry/on_exit]");

static_assert(
    [] {
      using namespace sml;

      struct e1 {};
      struct e2 {};

      int on_entry_calls{};
      int on_exit_calls{};

      sm sm = [&] {
        using namespace dsl;
        constexpr auto on_entry = dsl::on_entry;
        constexpr auto on_exit = dsl::on_exit;
        return transition_table{
            *"s1"_s + event<e1> = "s2"_s,
             "s2"_s + event<e2>,
             "s2"_s + on_entry / [&] { ++on_entry_calls; },
             "s2"_s + on_exit / [&] { ++on_exit_calls; },
        };
      };

      using dsl::operator""_s;
      return sm.process_event(e1{}) and sm.is("s2"_s) and on_entry_calls == 1 and on_exit_calls == 0 and
             sm.process_event(e2{}) and on_entry_calls == 1 and on_exit_calls == 0 and sm.is("s2"_s);
    }(),
    "feature.process_event[on_entry/on_exit] with internal transitions");

static_assert(
    [] {
      using namespace sml;

      struct e1 {};

      sm sm = [] {
        using namespace dsl;
        return transition_table{
            *"s1"_s + event<e1> = "s2"_s,
            "s2"_s + event<e1> = "s3"_s,
        };
      };

      using dsl::operator""_s;
      return sm.process_event(e1{}) and sm.is("s2"_s) and
             sm.process_event(e1{}) and sm.is("s3"_s);
    }(),
    "feature.process_event[same event multiple times]");

static_assert(
    [] {
      using namespace sml;

      struct e {
        int value{};
      };
      unsigned value{};

      sm sm = [&] {
        using namespace dsl;
        auto action = [&](const auto& event, auto... args) {
          value += event.value + (args + ...);
        };
        return transition_table{
            *"s1"_s + event<e> / action,
        };
      };

      using dsl::operator""_s;
      return sm.process_event(e{.value = 1}, 2, 3) and 6 == value;
    }(),
    "feature.process_event[with parameters]");

static_assert(
    [] {
      using namespace sml;

      struct e1 {};
      struct e2 {};
      struct e {
        int value{};
      };

      sm sm = [] {
        using namespace dsl;
        return transition_table{
            *"s1"_s + event<e1> = "s2"_s,
            "s2"_s + event<e2> = "s3"_s,
            "s3"_s + event<e2> = X,
            _ + event<e> = "s1"_s,
        };
      };

      using dsl::operator""_s;

      return sm.process_event(e1{}) and sm.is("s2"_s) and

             sm.process_event(e{{}}) and                       // _ -> s1
             sm.is("s1"_s) and not sm.process_event(e2{}) and  // ignored
             sm.is("s1"_s) and

             sm.process_event(e1{}) and  // s1 -> s2
             sm.is("s2"_s) and

             sm.process_event(e2{}) and  // s2 -> s3
             sm.is("s3"_s) and

             sm.process_event(e{}) and  // _ -> s1
             sm.is("s1"_s);
    }(),
    "feature.process_event[different events in any state]");

static_assert(
    [] {
      using namespace sml;
      struct unexpected {};
      struct e1 {};

      sm sm = [] {
        using namespace dsl;
        return transition_table{
            *"s1"_s + event<e1> = "s2"_s,
        };
      };

      constexpr auto process_event = [](auto event) {
        return requires { sm.process_event(event); };
      };

      static_assert(process_event(e1{}));
      static_assert(not process_event(unexpected{}));
      return true;
    }(),
    "feature.proces_event[unexpected event]");

static_assert(
    [] {
      using namespace sml;

      struct e1 {};
      struct e2 {};

      const auto test = [] {
        using namespace dsl;
        return transition_table{
            *"s1"_s + event<e1, e2> = "s2"_s,
        };
      };

      using dsl::operator""_s;

      return [&] {
        sm sm{test};
        return sm.is("s1"_s) and sm.process_event(e1{}) and sm.is("s2"_s);
      }() and [&] {
        sm sm{test};
        return sm.is("s1"_s) and sm.process_event(e2{}) and sm.is("s2"_s);
      }();
    }(),
    "feature.events[multiple events]");

static_assert(
    [] {
      using namespace sml;

      struct e1 {};
      struct e2 {};

      const auto test = [] {
        using namespace dsl;
        return transition_table{
            *"idle"_s + event<e1> / [] {} = "s1"_s,
            "s1"_s + event<e1> / [] {} = "s2"_s,
            "s2"_s + event<e1> / [] {} = "idle"_s,
        };
      };

      sm sm{test};
      using dsl::operator""_s;
      return sm.is("idle"_s) and sm.process_event(e1{}) and sm.is("s1"_s) and
             sm.process_event(e1{}) and sm.is("s2"_s) and
             sm.process_event(e1{}) and sm.is("idle"_s);
    }(),
    "feature.events[same event transitions]");

static_assert(
    [] {
      using namespace sml;

      struct e1 {};
      struct e2 {};

      sm sm = [] {
        using namespace dsl;
        return transition_table{
            *"s1"_s + event<e1> = "s2"_s,
            "s2"_s + event<e2> = "s1"_s,
        };
      };

      using dsl::operator""_s;

      return sm.is("s1"_s) and sm.process_event(e1{}) and sm.is("s2"_s) and
             not sm.process_event(e1{}) and sm.is("s2"_s) and
             sm.process_event(e2{}) and sm.is("s1"_s);
    }(),
    "feature.transition_table[multiple transitions]");

static_assert(
    [] {
      using namespace sml;

      struct e1 {};

      sm sm = [] {
        using namespace dsl;
        return transition_table{
            *"s1"_s + event<e1> = X,
        };
      };

      using dsl::operator""_s;
      using dsl::X;
      return sm.is("s1"_s) and sm.process_event(e1{}) and sm.is(X) and
             not sm.process_event(e1{});
    }(),
    "feature.transition_table[terminated state]");

static_assert(
    [] {
      using namespace sml;

      struct e {
        int value;
      };

      unsigned calls{};

      sm sm = [&] {
        using namespace dsl;
        auto guard = [](const auto& event) { return event.value; };
        auto action = [&] { ++calls; };
        return transition_table{
            *"s1"_s + event<e>[guard and (guard or guard)] / (action, action) =
                "s2"_s,
        };
      };

      using dsl::operator""_s;
      return not sm.process_event(e{false}) and sm.is("s1"_s) and
             sm.process_event(e{true}) and sm.is("s2"_s);
    }(),
    "feature.transition_table[guards/actions]");

static_assert(
    [] {
      using namespace sml;

      struct e {
        int value{};
      };

      sm sm = [&] {
        using namespace dsl;
        constexpr auto guard = [](const auto& event) { return event.value; };
        return transition_table{
            *"s1"_s + event<e>[guard] = "s2"_s,
            "s1"_s + event<e>[otherwise] = "s3"_s,
        };
      };

      using dsl::operator""_s;
      return sm.process_event(e{false}) and sm.is("s3"_s);
    }(),
    "feature.transition_table[otherwise guard]");

namespace sml::test {
template<auto Value>
struct bool_constant {
  static constexpr auto value = Value;
};
} // sml::test

static_assert(
    [] {
      using namespace sml;

      struct e1 {
        int value{};
      };
      struct e2 {};

      unsigned value{};

      sm sm = [&] {
        using namespace dsl;
        auto ct_guard = [](const auto& event) {
          return sml::test::bool_constant<requires { event.value; }>{};
        };
        auto action = [&](const auto& event) { value += event.value; };
        return transition_table{
            *"s1"_s + event<e1>[ct_guard] / action,
            "s1"_s + event<e2>[ct_guard] / action,
        };
      };

      using dsl::operator""_s;
      return 0 == value and sm.process_event(e1{.value = 42}) and
             42 == value and not sm.process_event(e2{}) and 42 == value;
    }(),
    "feature.transition_table[constexpr guards]");

static_assert(
    [] {
      using namespace sml;

      struct e1 {};
      struct e2 {};

      sm sm = [] {
        using namespace dsl;
        return transition_table{
            *"s1"_s + event<e1> / process(e2{}) = "s2"_s,
            "s2"_s + event<e2> = "s3"_s,
        };
      };

      using dsl::operator""_s;
      return sm.process_event(e1{}) and sm.is("s3"_s);
    }(),
    "feature.transition_table[process]");

static_assert(
    [] {
      using namespace sml;

      struct e1 {};
      struct e2 {};

      sm sm = [] {
        using namespace dsl;
        return transition_table{
            *"s1"_s + event<e1> = "s2"_s,
            *"s3"_s + event<e2> = "s4"_s,
        };
      };

      using dsl::operator""_s;
      return sm.is("s1"_s, "s3"_s) and sm.process_event(e1{}) and
             sm.is("s2"_s, "s3"_s) and sm.process_event(e2{}) and
             sm.is("s2"_s, "s4"_s);
    }(),
    "feature.transition_table[orthogonal regions]");

static_assert(
    [] {
      using namespace sml;

      struct e1 {};
      struct e2 {};
      struct e3 {};

      sm sm = [] {
        using namespace dsl;
        return transition_table{
            *"s1"_s + event<e1> = "s2"_s,
             "s2"_s + event<e2> = X,
            // -------------------------
            *"s3"_s + event<e3> = X,
        };
      };

      using dsl::operator""_s;
      using dsl::X;
      return sm.is("s1"_s, "s3"_s) and sm.process_event(e1{}) and
             sm.is("s2"_s, "s3"_s) and sm.process_event(e2{}) and
             sm.is(X, "s3"_s) and sm.process_event(e3{}) and sm.is(X, X);
    }(),
    "feature.transition_table[orthogonal regions]");

static_assert(
    [] {
      using namespace sml;

      struct e1 {};
      struct e2 {};

      unsigned calls{};
      auto guard = [] { return true; };
      auto action = [&] { ++calls; };

      sm sm = [=] {
        using namespace dsl;
        return dispatch_table{
            event<e1>[guard] / action,
            event<e2>[guard] / action,
        };
      };

      using dsl::operator""_s;
      return 0 == calls and sm.process_event(e1{}) and 1 == calls and
             sm.process_event(e2{}) and 2 == calls;
    }(),
    "feature.dispatch_table");

static_assert(
    [] {
      using namespace sml;

      struct e1 {};

      struct s {
        bool value{};

        constexpr auto operator()() const {
          using namespace dsl;
          auto guard = [this] { return value; };
          return transition_table{
              *"s1"_s + event<e1>[guard] = "s2"_s,
          };
        }
      };

      using dsl::operator""_s;
      return [&] {
        s s{};
        sm sm{s};
        return not sm.process_event(e1{}) and sm.is("s1"_s);
      }() and [&] {
        s s{true};
        sm sm{s};
        return sm.process_event(e1{}) and sm.is("s2"_s);
      }();
    }(),
    "feature.dependencies");

static_assert(
    [] {
      struct connect {};
      struct established {};
      struct ping {};
      struct disconnect {};
      struct timeout {};

      struct Connection {
        constexpr auto operator()() const {
          constexpr auto establish = [] {};
          constexpr auto close = [] {};
          constexpr auto is_valid = [](auto const&) { return true; };
          constexpr auto reset_timeout = [] {};

          using namespace sml::dsl;
          return transition_table{
              *"Disconnected"_s + event<connect> / establish = "Connecting"_s,
              "Connecting"_s + event<established> = "Connected"_s,
              "Connected"_s + event<ping>[is_valid] / reset_timeout,
              "Connected"_s + event<timeout> / establish = "Connecting"_s,
              "Connected"_s + event<disconnect> / close = "Disconnected"_s,
          };
        }
      };

      sml::sm connection{Connection{}};
      using sml::dsl::operator""_s;
      return connection.is("Disconnected"_s) and
             connection.process_event(connect{}) and
             connection.is("Connecting"_s) and
             connection.process_event(established{}) and
             connection.is("Connected"_s) and
             connection.process_event(ping{}) and
             connection.is("Connected"_s) and
             connection.process_event(disconnect{}) and
             connection.is("Disconnected"_s);
    }(),
    "example.connection");

#if not defined(__cpp_modules)
#endif  // SML2
#endif
#endif
