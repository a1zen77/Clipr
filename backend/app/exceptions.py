class ClipperError(Exception):
    """Base exception for all clipper errors."""
    pass


class VideoUnavailableError(ClipperError):
    """Video is private, deleted, or geo-restricted."""
    pass


class VideoTooLongError(ClipperError):
    """Source video exceeds the allowed duration."""
    pass


class VideoDownloadError(ClipperError):
    """yt-dlp failed to download the video."""
    pass


class VideoClipError(ClipperError):
    """FFmpeg failed to cut the clip."""
    pass


class ThumbnailError(ClipperError):
    """FFmpeg failed to generate the thumbnail."""
    pass


class NoVideoStreamError(ClipperError):
    """The post has no video content."""
    pass
