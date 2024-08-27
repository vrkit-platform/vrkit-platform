


#include <IRacingTools/Shared/Common/UUIDHelpers.h>

#include <boost/uuid/uuid.hpp>
#include <boost/uuid/uuid_generators.hpp>
#include <boost/uuid/uuid_io.hpp>

namespace IRacingTools::Shared::Common {

    std::string NewUUID() {
        auto generator = boost::uuids::random_generator();
        boost::uuids::uuid uuid = generator();

        return to_string(uuid);
    }
}