//
// Created by jglanz on 1/18/2024.
//
#include <IRacingTools/Shared/TrackMapGeometry.h>

namespace IRacingTools::Shared::Geometry {

TrackMap ToTrackMap(const LapTrajectory &lapTrajectory, ZoomLevel zoomLevel) {
    return LapTracjectoryConverter(zoomLevel).toTrackMap(lapTrajectory);
}

TrackMap ScaleTrackMapToFit(const TrackMap &trackMap, const Graphics::Size &size) {
    TrackMap scaled(trackMap);

    auto scaledSize = scaled.mutable_scaled_size();

    scaledSize->set_width(size.width);
    scaledSize->set_height(size.height);


    float scaleX = scaledSize->width() / trackMap.size().width();
    float scaleY = scaledSize->height() / trackMap.size().height();
    float scaleRatio = std::min<float>(scaleX,scaleY);
    scaled.set_scaled_ratio(scaleRatio);

    auto pointCount = scaled.points_size();
    for (int idx = 0; idx < pointCount;idx++) {
        auto point = scaled.mutable_points(idx);
        point->set_x(point->x() * scaleRatio);
        point->set_y(point->y() * scaleRatio);
    }

    return scaled;
}
}
