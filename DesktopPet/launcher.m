// Finder starts this small launcher. macOS provides the script runtime used by Ghosty.
#import <Cocoa/Cocoa.h>

static NSString *petName(void) {
    return [NSBundle.mainBundle objectForInfoDictionaryKey:@"CFBundleName"];
}

static int showFailure(NSString *detail) {
    [NSApplication sharedApplication];
    [NSApp setActivationPolicy:NSApplicationActivationPolicyAccessory];
    [NSApp activateIgnoringOtherApps:YES];
    NSAlert *alert = [NSAlert new];
    alert.messageText = [petName() stringByAppendingString:@" couldn’t start"];
    alert.informativeText = detail;
    [alert runModal];
    return 1;
}

int main(void) {
    @autoreleasepool {
        NSFileManager *files = NSFileManager.defaultManager;
        NSURL *library = [files URLsForDirectory:NSLibraryDirectory inDomains:NSUserDomainMask].firstObject;
        NSURL *folder = [library URLByAppendingPathComponent: [@"Logs" stringByAppendingPathComponent:petName()]];
        NSError *error = nil;
        if (![files createDirectoryAtURL:folder withIntermediateDirectories:YES attributes:nil error:&error])
            return showFailure(error.localizedDescription);
        NSURL *log = [folder URLByAppendingPathComponent:@"startup.log"];
        if (![[NSString stringWithFormat:@"Starting %@…\n", petName()] writeToURL:log atomically:YES encoding:NSUTF8StringEncoding error:&error])
            return showFailure(error.localizedDescription);
        NSFileHandle *output = [NSFileHandle fileHandleForWritingToURL:log error:&error];
        if (!output) return showFailure(error.localizedDescription);
        [output seekToEndOfFile];

        NSURL *resources = NSBundle.mainBundle.resourceURL;
        NSTask *host = [NSTask new];
        host.executableURL = [NSURL fileURLWithPath:@"/usr/bin/osascript"];
        host.arguments = @[@"-l", @"JavaScript", [resources URLByAppendingPathComponent:@"window.js"].path,
                           [resources URLByAppendingPathComponent:@"pet.html"].path, petName()];
        host.standardError = output;
        host.standardOutput = output;
        if (![host launchAndReturnError:&error]) return showFailure(error.localizedDescription);
        [host waitUntilExit];
        if (host.terminationStatus != 0 && host.terminationReason == NSTaskTerminationReasonExit)
            return showFailure([NSString stringWithFormat:@"See ~/Library/Logs/%@/startup.log for the launch error.", petName()]);
        return 0;
    }
}
