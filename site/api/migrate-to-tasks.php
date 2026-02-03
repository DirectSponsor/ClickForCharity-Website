<?php
/**
 * Migration Script: Initialize Tasks and Update Profiles
 * 1. Seeds the new /var/clickforcharity-data/tasks/tasks.json
 * 2. Updates user profiles by renaming "ComplexTask" keys to "Task" keys
 */

$targetDir = '/var/clickforcharity-data/tasks';
$targetFile = $targetDir . '/tasks.json';
$profilesDir = '/var/clickforcharity-data/userdata/profiles';

// Data to seed
$tasksData = [
  [
    "id" => "task_001",
    "title" => "Follow @ClickForAfrica on X",
    "shortDescription" => "Follow our X account to stay updated",
    "instructions" => "1. Click the Visit button to open X/Twitter\n2. Click the Follow button on our profile\n3. Return here and click Complete when done",
    "url" => "https://x.com/clickforafrica",
    "reward" => 50,
    "duration" => 30,
    "category" => "follows",
    "platform" => "x",
    "requiresLogin" => true,
    "repeatable" => false,
    "enabled" => true
  ],
  [
    "id" => "task_002",
    "title" => "Subscribe to RoflFaucet on YouTube",
    "shortDescription" => "This is our main YouTube channel",
    "instructions" => "1. Click Visit to open our YouTube channel\n2. Click the Subscribe button\n3. Return here and click Complete",
    "url" => "https://www.youtube.com/@roflfaucet",
    "reward" => 50,
    "duration" => 30,
    "category" => "follows",
    "platform" => "youtube",
    "requiresLogin" => true,
    "repeatable" => false,
    "enabled" => true
  ],
  [
    "id" => "task_003",
    "title" => "Follow RoflFaucet on Odysee",
    "shortDescription" => "Follow our Odysee channel",
    "instructions" => "1. Visit our Odysee channel\n2. Click Follow\n3. Return and mark complete",
    "url" => "https://odysee.com/@roflfaucet:7",
    "reward" => 75,
    "duration" => 30,
    "category" => "follows",
    "platform" => "odysee",
    "requiresLogin" => true,
    "repeatable" => false,
    "enabled" => true
  ],
  [
    "id" => "task_004",
    "title" => "Like our latest post",
    "shortDescription" => "Like this X post",
    "instructions" => "1. Visit the post\n2. Click the heart/like button\n3. Return and complete the task",
    "url" => "https://x.com/clickforafrica/status/1848153456898355627",
    "reward" => 25,
    "duration" => 20,
    "category" => "engagements",
    "platform" => "x",
    "requiresLogin" => true,
    "repeatable" => true,
    "enabled" => true
  ],
  [
    "id" => "task_005",
    "title" => "Like our charity video",
    "shortDescription" => "Give a thumbs up to our friend's video",
    "instructions" => "1. Watch at least 30 seconds of the video\n2. Click the thumbs up button\n3. Return and complete",
    "url" => "https://www.youtube.com/watch?v=m_jyqX1r5QM",
    "reward" => 30,
    "duration" => 45,
    "category" => "engagements",
    "platform" => "youtube",
    "requiresLogin" => true,
    "repeatable" => true,
    "enabled" => true
  ],
  [
    "id" => "task_006",
    "title" => "Visit our site from social media",
    "shortDescription" => "Help us build social media traffic",
    "instructions" => "1. Click Visit to open our social media post\n2. Click the link in the post to visit our website\n3. Browse at least 2 pages on the site\n4. Return here and click Complete",
    "url" => "https://tangled.com/c/b8ad3bae37b010c6baafe912ae3c5c0aed81cbfd4",
    "reward" => 30,
    "duration" => 60,
    "category" => "other",
    "platform" => "none",
    "requiresLogin" => true,
    "repeatable" => true,
    "enabled" => true
  ],
  [
    "id" => "task_007",
    "title" => "Search and visit our site",
    "shortDescription" => "Help improve our search rankings",
    "instructions" => "1. Click Visit to open Google search\n2. Search for 'click for charity'\n3. Find and click our website in results\n4. Stay on site for 30+ seconds, visit 2+ pages\n5. Return and complete",
    "url" => "https://www.google.com/search?q=click+for+charity",
    "reward" => 35,
    "duration" => 90,
    "category" => "other",
    "platform" => "none",
    "requiresLogin" => true,
    "repeatable" => true,
    "enabled" => true
  ]
];

echo "<h3>Step 1: Initializing New Task Data</h3>";
if (!is_dir($targetDir)) {
    mkdir($targetDir, 0755, true);
    echo "Created directory: $targetDir<br>";
}

if (file_put_contents($targetFile, json_encode($tasksData, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES))) {
    echo "Success: Initialized tasks.json at $targetFile<br>";
} else {
    echo "Error: Failed to write to $targetFile<br>";
}

echo "<h3>Step 2: Migrating User Profiles</h3>";
if (!is_dir($profilesDir)) {
    echo "No profiles found to migrate at $profilesDir<br>";
} else {
    $files = glob($profilesDir . '/*.txt');
    $count = 0;
    foreach ($files as $file) {
        $content = file_get_contents($file);
        $data = json_decode($content, true);
        
        if ($data) {
            $changed = false;
            
            // Migrate completed tasks key
            if (isset($data['completedComplexTasks'])) {
                $data['completedTasks'] = $data['completedComplexTasks'];
                unset($data['completedComplexTasks']);
                $changed = true;
            }
            
            // Migrate skipped tasks key
            if (isset($data['skippedComplexTasks'])) {
                $data['skippedTasks'] = $data['skippedComplexTasks'];
                unset($data['skippedComplexTasks']);
                $changed = true;
            }
            
            if ($changed) {
                file_put_contents($file, json_encode($data, JSON_PRETTY_PRINT));
                $count++;
            }
        }
    }
    echo "Migrated $count user profiles successfully.<br>";
}

echo "<h3>Migration Complete!</h3>";
echo "You can now safely use the new /tasks.html page.";
